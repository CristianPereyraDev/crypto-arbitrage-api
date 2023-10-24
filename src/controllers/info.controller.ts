import { Router, type Request, type Response, type NextFunction } from 'express'

import { currencyPairs } from '../startup/pricing_collector.js'
import { Exchange } from '../databases/mongodb/schema/exchange.schema.js'

const controller = Router()

controller
  .get(
    '/pairs_available',
    async (req: Request, res: Response, next: NextFunction) => {
      return res.status(200).json(currencyPairs)
    }
  )
  .get(
    '/exchanges_available/:crypto-:fiat',
    async (req: Request, res: Response, next: NextFunction) => {
      const { crypto, fiat } = req.params
      try {
        const exchanges = await Exchange.find({}).exec()

        return res
          .status(200)
          .json(
            exchanges.filter(
              exchange =>
                exchange.pairs.find(
                  pair => pair.crypto === crypto && pair.fiat === fiat
                ) !== undefined
            )
          )
      } catch (error) {
        return res.status(404).json({ message: 'Error' })
      }
    }
  )

export default controller
