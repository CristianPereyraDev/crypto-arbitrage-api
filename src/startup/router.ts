import { type Express, type Request, type Response } from 'express'
import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import * as AdminJSMongoose from '@adminjs/mongoose'

import MongoStore from 'connect-mongo'
import mongoose from 'mongoose'

import arbitragesRouter from '../controllers/arbitrages.controller.js'
import infoRouter from '../controllers/info.controller.js'

import { ExchangeBase } from '../databases/mongodb/schema/exchange_base.schema.js'

import { gql } from 'graphql-tag'
import { ApolloServer } from '@apollo/server'
import { buildSubgraphSchema } from '@apollo/subgraph'
import { expressMiddleware } from '@apollo/server/express4'
import resolvers from '../graphql/resolvers.js'
import { readFileSync } from 'fs'
import path from 'path'

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database
})

const authenticate = async (email: string, password: string) => {
  if (
    email === process.env.DEFAULT_ADMIN_EMAIL &&
    password === process.env.DEFAULT_ADMIN_PASSWORD
  ) {
    return Promise.resolve({ email, password })
  }
  return null
}

const routerSetup = async (app: Express): Promise<Express> => {
  const admin = new AdminJS({ resources: [ExchangeBase] })

  const sessionStore = MongoStore.create({
    client: mongoose.connection.getClient() as any
  })

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'adminjs',
      cookiePassword: process.env.SESSION_SECRET || 'sessionsecret'
    },
    null,
    {
      store: sessionStore,
      resave: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET || 'sessionsecret',
      cookie: {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production'
      },
      name: 'adminjs'
    }
  )

  // GraphQL
  const filePath = path.join(process.cwd(), 'src', 'graphql', 'schema.graphql')
  const typeDefs = gql(readFileSync(filePath, { encoding: 'utf-8' }))
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers })
  })
  await server.start()

  return app
    .get('/', (req: Request, res: Response) => {
      res
        .status(200)
        .send(
          `<h1 style="text-align: center">Welcome to Crypto Arbitrage Api<h1>`
        )
    })
    .use('/graphql', expressMiddleware(server))
    .use('/api', infoRouter)
    .use('/api/arbitrages', arbitragesRouter)
    .use(admin.options.rootPath, adminRouter)
}

export default routerSetup
