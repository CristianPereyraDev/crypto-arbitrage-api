import { type Express, type Request, type Response } from 'express'
import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import * as AdminJSMongoose from '@adminjs/mongoose'

import MongoStore from 'connect-mongo'
import mongoose from 'mongoose'

import arbitragesRouter from '../controllers/arbitrages.controller.js'
import infoRouter from '../controllers/info.controller.js'

import { Exchange } from '../databases/mongodb/schema/exchange.schema.js'

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

const routerSetup = (app: Express): Express => {
  const admin = new AdminJS({ resources: [Exchange] })

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

  return app
    .get('/', (req: Request, res: Response) => {
      res
        .status(200)
        .send(
          `<h1 style="text-align: center">Welcome to Crypto Arbitrage Api<h1>`
        )
    })
    .use('/api', infoRouter)
    .use('/api/arbitrages', arbitragesRouter)
    .use(admin.options.rootPath, adminRouter)
}

export default routerSetup
