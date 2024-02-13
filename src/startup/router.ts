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
import { Exchange } from '../databases/mongodb/schema/exchange.schema.js'
import { P2PExchange } from '../databases/mongodb/schema/exchange_p2p.schema.js'
import { Brokerage } from '../databases/mongodb/schema/brokerage_schema.js'

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
  const admin = new AdminJS({
    resources: [
      ExchangeBase,
      {
        resource: Exchange,
        options: {
          properties: {
            'pricesByPair.asksAndBids': {
              isVisible: { edit: false, list: false }
            }
          }
        }
      },
      {
        resource: Brokerage
      },
      {
        resource: P2PExchange,
        options: {
          properties: {
            'ordersByPair.orders': {
              isVisible: { edit: false, list: false }
            }
          }
        }
      }
    ]
  })

  const sessionStore = MongoStore.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const __dirname = new URL('.', import.meta.url).pathname
  const filePath = path.resolve(__dirname, '../graphql/schema.graphql')
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
