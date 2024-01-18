import { ExchangeBase } from 'src/databases/mongodb/schema/exchange_base.schema.js'
import { Exchange } from 'src/databases/mongodb/schema/exchange.schema.js'
import { IExchangePricing } from 'src/types/exchange.js'
import {
  IP2POrder,
  IPair,
  P2POrderType
} from 'src/databases/mongodb/model/exchange.model.js'
import { CollectorFunctionReturnType } from '../utils/apis/crypto_exchanges/index.js'
import { P2PExchange } from 'src/databases/mongodb/schema/exchange_p2p.schema.js'

export async function updateP2POrders (
  exchangeName: string,
  baseAsset: string,
  fiat: string,
  orderType: P2POrderType,
  orders: IP2POrder[]
) {
  try {
    let target =
      orderType === 'BUY'
        ? 'ordersByPair.$[i].buyOrders'
        : 'ordersByPair.$[i].sellOrders'

    await P2PExchange.findOneAndUpdate(
      { name: exchangeName },
      { $set: { [target]: orders } },
      {
        arrayFilters: [
          {
            'i.crypto': baseAsset,
            'i.fiat': fiat
          }
        ]
      }
    )
  } catch (error) {
    console.error('An error in updateP2POrders has ocurred: %s', error)
  }
}

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

function calculateOrderBookAvgPrice (orders: number[][], volume: number) {
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

export async function getAllExchangesPricesBySymbol (
  asset: string,
  fiat: string,
  volume: number = 1.0
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
        const avgAsk = calculateOrderBookAvgPrice(pairPrices[0].asks, volume)
        const avgBid = calculateOrderBookAvgPrice(pairPrices[0].bids, volume)

        return {
          exchange: exchange.name,
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
