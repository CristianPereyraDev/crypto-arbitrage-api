import { Router, type Request, type Response, type NextFunction } from 'express'
import CryptoArbitrageModel from '../databases/mongodb/schema/arbitrage.schema.js'

const controller = Router()

controller.get(
  '/:crypto/:fiat/:volume/:minProfit',
  async (req: Request, res: Response, next: NextFunction) => {
    const { crypto, fiat, minProfit } = req.params

    try {
      const minTimeInSeconds =
        (Date.now() - Number(process.env.PRICING_COLLECTOR_INTERVAL ?? 6000)) /
        1000

      const arbitrages = await CryptoArbitrageModel.find({
        cryptocurrency: crypto.toUpperCase(),
        fiat: fiat.toUpperCase()
      })
        .sort({ time: -1 })
        .where('time')
        .gte(minTimeInSeconds)
        .where('profit')
        .gte(Number(minProfit))
        .exec()

      return arbitrages.length > 0
        ? res.status(200).json({ arbitrageFound: true, arbitrage: arbitrages })
        : res
            .status(200)
            .json({ arbitrageFound: false, message: 'Arbitrage not found.' })
    } catch (error) {
      next(error)
    }
  }
)

export default controller
