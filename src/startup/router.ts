import { type Express, type Request, type Response } from 'express'
import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import * as AdminJSMongoose from '@adminjs/mongoose'

import arbitragesRouter from '../controllers/arbitrages.controller.js'
import infoRouter from '../controllers/info.controller.js'

import { Exchange } from '../databases/mongodb/schema/exchange.schema.js'

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database
})

const routerSetup = (app: Express): Express => {
  const admin = new AdminJS({ resources: [Exchange] })

  const adminRouter = AdminJSExpress.buildRouter(admin)

  // console.log(
  //   `AdminJS started on http://localhost:${process.env.PORT}${admin.options.rootPath}`
  // )

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
