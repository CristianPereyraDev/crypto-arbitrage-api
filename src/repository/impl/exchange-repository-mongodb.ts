import { IExchange } from '../../databases/model/exchange.model.js'
import { IPair } from '../../databases/model/exchange_base.model.js'
import { IExchangePricingDTO } from '../../types/dto/index.js'
import { IExchangeRepository } from '../exchange-repository.js'
import { ExchangeBaseRepository } from '../exchange-base-repository.js'
import { Exchange } from '../../databases/mongodb/schema/exchange.schema.js'
import { ExchangeCollectorReturnType } from '../../utils/apis/crypto_exchanges/index.js'

export default class ExchangeRepositoryMongoDB
  extends ExchangeBaseRepository<IExchange>
  implements IExchangeRepository
{
  async updateExchangePrices (
    exchangeName: string,
    baseAsset: string,
    quoteAsset: string,
    prices: ExchangeCollectorReturnType
  ): Promise<void> {
    try {
      await Exchange.findOneAndUpdate(
        {
          name: exchangeName
        },
        {
          $push: {
            'pricesByPair.$[i].asksAndBids': {
              asks: prices.asks,
              bids: prices.bids,
              createdAt: Date.now()
            }
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

  async removeOlderPrices (): Promise<void> {
    try {
      await Exchange.updateMany(
        {},
        {
          $pull: {
            'pricesByPair.$[].asksAndBids': {
              createdAt: { $lte: new Date(Date.now() - 1000 * 60) }
            }
          }
        }
      )
    } catch (error) {
      console.error(error)
    }
  }

  async getAllPricesByPair (
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]> {
    try {
      const exchanges = await Exchange.find({
        'availablePairs.crypto': pair.crypto,
        'availablePairs.fiat': pair.fiat,
        available: true
      })

      const prices = exchanges.map(exchange => {
        // Find pair's prices for current exchange and sort
        const pairPrices = exchange.pricesByPair
          .find(
            priceByPair =>
              priceByPair.crypto === pair.crypto &&
              priceByPair.fiat === pair.fiat
          )
          ?.asksAndBids.sort((pricingA, pricingB) =>
            pricingA.createdAt !== undefined && pricingB.createdAt !== undefined
              ? pricingA.createdAt?.getTime() - pricingB.createdAt?.getTime()
              : 0
          )

        if (pairPrices !== undefined && pairPrices.length > 0) {
          const avgAsk = this.calculateOrderBookAvgPrice(
            pairPrices[0].asks,
            volume
          )
          const avgBid = this.calculateOrderBookAvgPrice(
            pairPrices[0].bids,
            volume
          )

          return {
            exchange: exchange.name,
            exchangeType: exchange.exchangeType,
            exchangeLogoURL: exchange.logoURL,
            ask: avgAsk,
            totalAsk: avgAsk,
            bid: avgBid,
            totalBid: avgBid,
            time: 1
          }
        } else {
          return {
            exchange: exchange.name,
            exchangeType: exchange.exchangeType,
            exchangeLogoURL: exchange.logoURL,
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

  getExchangeByName (name: string): Promise<IExchange> {
    throw new Error('Method not implemented.')
  }

  async getAllExchanges (): Promise<IExchange[]> {
    try {
      return await Exchange.find({ available: true })
    } catch (error) {
      console.error(error)
      return []
    }
  }

  private calculateOrderBookAvgPrice (orders: number[][], volume: number) {
    let avg = [0, volume]

    for (let i = 0; i < orders.length; i++) {
      if (avg[1] > orders[i][1]) {
        avg[0] += orders[i][0] * orders[i][1]
        avg[1] -= orders[i][1]
      } else {
        avg[0] += orders[i][0] * avg[1]
        avg[1] = 0
        break
      }
    }

    return avg[0] / volume
  }
}
