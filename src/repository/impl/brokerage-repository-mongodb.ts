import { IBrokerage } from 'src/databases/model/brokerage.model.js'
import { IPair } from 'src/databases/model/exchange_base.model.js'
import { IExchangePricingDTO } from 'src/types/dto/index.js'
import { IBrokerageRepository } from '../brokerage-repository.js'
import { ExchangeBaseRepository } from '../exchange-base-repository.js'
import { Brokerage } from 'src/databases/mongodb/schema/brokerage_schema.js'

export default class BrokerageRepositoryMongoDB
  extends ExchangeBaseRepository<IBrokerage>
  implements IBrokerageRepository
{
  async updateBrokeragePrices (
    exchangeName: string,
    baseAsset: string,
    quoteAsset: string,
    ask: number,
    bid: number
  ): Promise<void> {
    try {
      await Brokerage.findOneAndUpdate(
        {
          name: exchangeName
        },
        {
          $set: {
            'pricesByPair.$[i].ask': ask,
            'pricesByPair.$[i].bid': bid
          }
        },
        {
          arrayFilters: [
            {
              'i.crypto': baseAsset,
              'i.fiat': quoteAsset
            }
          ]
        }
      ).exec()
    } catch (error) {
      console.error('An error in updateExchangePrices has ocurred: %s', error)
    }
  }

  removeOlderPrices (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async getAllPricesByPair (pair: IPair): Promise<IExchangePricingDTO[]> {
    try {
      const exchanges = await Brokerage.find({
        'availablePairs.crypto': pair.crypto,
        'availablePairs.fiat': pair.fiat,
        available: true
      })

      const prices = exchanges.map(brokerage => {
        // Find pair's prices for current exchange and sort
        const pairPrices = brokerage.pricesByPair.find(
          priceByPair =>
            priceByPair.crypto === pair.crypto && priceByPair.fiat === pair.fiat
        )

        if (pairPrices !== undefined) {
          return {
            exchange: brokerage.name,
            exchangeLogoURL: brokerage.logoURL,
            ask: pairPrices.ask,
            totalAsk: pairPrices.ask,
            bid: pairPrices.bid,
            totalBid: pairPrices.bid,
            time: 1
          }
        } else {
          return {
            exchange: brokerage.name,
            exchangeLogoURL: brokerage.logoURL,
            ask: 0,
            totalAsk: 0,
            bid: 0,
            totalBid: 0,
            time: 1
          }
        }
      })

      return prices
    } catch (error) {
      console.log(error)
      return []
    }
  }

  getExchangeByName (name: string): Promise<IBrokerage> {
    throw new Error('Method not implemented.')
  }

  getAllExchanges (): Promise<IBrokerage[]> {
    throw new Error('Method not implemented.')
  }
}
