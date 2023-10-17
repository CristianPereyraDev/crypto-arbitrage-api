import { type Express, type Request, type Response } from 'express'
import pricesRouter from '../controllers/prices.controller'

const routerSetup = (app: Express): Express =>
  app
    .get('/', (req: Request, res: Response) => {
      res.send('Hello Express APIvantage!')
    })
    .use('/api/pricing', pricesRouter)

export default routerSetup
