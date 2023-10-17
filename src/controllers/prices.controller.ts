import { Router, type Request, type Response, type NextFunction } from 'express'
import CryptoArbitrageModel from '../databases/mongodb/schema/arbitrage.schema'

const controller = Router()

controller.get(
  '/:crypto/:fiat/:volume/:minProfit',
  async (req: Request, res: Response, next: NextFunction) => {
    const { crypto, fiat, minProfit } = req.params

    try {
      const currentTimeInSeconds = Date.now() / 1000
      console.warn('Current time =', currentTimeInSeconds)
      const arbitrage = await CryptoArbitrageModel.findOne({
        cryptocurrency: crypto.toUpperCase(),
        fiat: fiat.toUpperCase()
      })
        .where('time')
        .gte(currentTimeInSeconds - 60)
        .where('profit')
        .gte(Number(minProfit))
        .exec()

      return arbitrage !== null
        ? res.status(200).json(arbitrage)
        : res.status(200).json({ message: 'Arbitrage not found' })
    } catch (error) {
      next(error)
    }
  }
)

export default controller
