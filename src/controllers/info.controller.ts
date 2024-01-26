import { Router, type Request, type Response, type NextFunction } from 'express'

import { Exchange } from '../databases/mongodb/schema/exchange.schema.js'
import { INetworkFee } from '../databases/model/exchange_base.model.js'
import { getExchangesFees } from '../databases/mongodb/utils/queries.util.js'
import { performScraping } from '../utils/scraping/cryptoya.js'
import ExchangeService from '../services/exchanges.service.js'
import ExchangeRepositoryMongoDB from '../repository/impl/exchange-repository-mongodb.js'
import BrokerageRepositoryMongoDB from '../repository/impl/brokerage-repository-mongodb.js'
import { ExchangeP2PRepositoryMongoDB } from '../repository/impl/exchange-p2p-repository-mongodb.js'

const controller = Router()

const exchangeService = new ExchangeService(
  new ExchangeRepositoryMongoDB(),
  new BrokerageRepositoryMongoDB(),
  new ExchangeP2PRepositoryMongoDB()
)

controller
  .get(
    '/pairs_available',
    async (req: Request, res: Response, next: NextFunction) => {
      const availablePairs = await exchangeService.getAvailablePairs()
      const response: string[] = availablePairs.map(
        pair => pair.crypto + '-' + pair.fiat
      )

      if (response !== null)
        res.status(200).json({ success: true, message: 'ok', data: response })
      else
        res.status(400).json({ success: false, message: 'error', data: null })
    }
  )
  .get(
    '/exchanges',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const exchanges = await Exchange.find({}).exec()

        return res.status(200).json(exchanges)
      } catch (error) {
        return res.status(404).json({ message: 'Error' })
      }
    }
  )
  .get(
    '/exchanges/:name',
    async (req: Request, res: Response, next: NextFunction) => {
      const { name } = req.params

      try {
        const exchange = await Exchange.findOne({ name: name }).exec()

        return res.status(200).json(exchange)
      } catch (error) {
        return res.status(404).json({ message: 'Error' })
      }
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
                exchange.availablePairs.find(
                  pair => pair.crypto === crypto && pair.fiat === fiat
                ) !== undefined
            )
          )
      } catch (error) {
        return res.status(404).json({ message: 'Error' })
      }
    }
  )
  .get('/fees', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fees = await getExchangesFees()

      return res.status(200).json(fees)
    } catch (error) {
      return res.status(500).json({ message: 'Error' })
    }
  })
  .put(
    '/generate_exchanges',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const response = await fetch('https://criptoya.com/api/fees')
        const jsonResponse: any = await response.json()

        // First delete collection
        await Exchange.deleteMany({})

        for (let exchange in jsonResponse) {
          const dbExchange = new Exchange({ name: exchange })

          for (let crypto in jsonResponse[exchange]) {
            let networks: INetworkFee[] = []
            for (let network in jsonResponse[exchange][crypto]) {
              networks.push({
                network,
                fee: jsonResponse[exchange][crypto][network]
              })
            }
            dbExchange.networkFees.push({
              crypto,
              networks: networks
            })
          }

          await dbExchange.save()
        }

        return res.status(200).json(jsonResponse)
      } catch (error) {
        return res.status(404).json({ message: error })
      }
    }
  )
  .get(
    '/exchangeIdsByPair',
    async (req: Request, res: Response, next: NextFunction) => {
      const scraping = await performScraping()
      const response: { [symbol: string]: { [id: string]: string } } = {}

      for (let symbol in scraping) {
        response[symbol] = scraping[symbol]['ids']
      }

      if (scraping !== null)
        res.status(200).json({ success: true, message: 'ok', data: response })
      else
        res.status(400).json({ success: false, message: 'error', data: null })
    }
  )

export default controller
