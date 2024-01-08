import { ExchangeBase } from 'src/databases/mongodb/schema/exchange_base.schema.js'
import { Exchange } from 'src/databases/mongodb/schema/exchange.schema.js'
import { IExchangePricing } from 'src/types/exchange.js'
import { IPair } from 'src/databases/mongodb/model/exchange.model.js'
import { CollectorFunctionReturnType } from 'src/utils/apis/exchanges/index.js'

export async function updateExchangePrices (
  exchangeName: string,
  baseAsset: string,
  quoteAsset: string,
  prices: CollectorFunctionReturnType
) {
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

export async function removeOlderPrices () {
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

export async function getAvailablePairs (): Promise<IPair[]> {
  const availablePairs: IPair[] = []

  try {
    const exchanges = await ExchangeBase.find({})

    for (let exchange of exchanges) {
      for (let availablePair of exchange.availablePairs) {
        if (
          !availablePairs.some(
            pair =>
              pair.crypto === availablePair.crypto &&
              pair.fiat === availablePair.fiat
          )
        ) {
          availablePairs.push(availablePair)
        }
      }
    }

    return availablePairs
  } catch (error) {
    return []
  }
}

export async function getPricesBySymbol (
  asset: string,
  fiat: string
): Promise<IExchangePricing[]> {
  try {
    const exchanges = await Exchange.find({
      'availablePairs.crypto': asset,
      'availablePairs.fiat': fiat
    })

    const prices = exchanges.map(exchange => {
      // Find pair's prices for current exchange and sort
      const pairPrices = exchange.pricesByPair
        .find(
          priceByPair =>
            priceByPair.crypto === asset && priceByPair.fiat === fiat
        )
        ?.asksAndBids.sort((pricingA, pricingB) =>
          pricingA.createdAt !== undefined && pricingB.createdAt !== undefined
            ? pricingA.createdAt?.getTime() - pricingB.createdAt?.getTime()
            : 0
        )

      if (pairPrices !== undefined && pairPrices.length > 0) {
        const lastPrice = pairPrices[0]
        return {
          exchange: exchange.name,
          ask: lastPrice.asks.length > 0 ? lastPrice.asks[0][0] : 0,
          totalAsk: lastPrice.asks.length > 0 ? lastPrice.asks[0][0] : 0,
          bid: lastPrice.bids.length > 0 ? lastPrice.bids[0][0] : 0,
          totalBid: lastPrice.bids.length > 0 ? lastPrice.bids[0][0] : 0,
          time: 1
        }
      } else {
        return {
          exchange: exchange.name,
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
