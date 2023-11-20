import { Exchange } from '../databases/mongodb/schema/exchange.schema.js'
import CryptoArbitrageModel from '../databases/mongodb/schema/arbitrage.schema.js'
import { pricesByCurrencyPair } from '../utils/apis/cryptoya.js'
import {
  ICryptoArbitrageResult,
  calculateArbitragesFromPairData
} from '../utils/arbitrage-calculator.js'
import { priceCollectorFunctions } from '../utils/apis/exchanges/index.js'

export const currencyPairs = [
  { crypto: 'MATIC', fiat: 'ARS' },
  { crypto: 'BTC', fiat: 'ARS' },
  { crypto: 'ETH', fiat: 'ARS' },
  { crypto: 'USDT', fiat: 'ARS' },
  { crypto: 'MANA', fiat: 'ARS' }
]

export async function collectArbitragesToDB (): Promise<void> {
  for (const pair of currencyPairs) {
    try {
      const prices = await pricesByCurrencyPair(pair.crypto, pair.fiat, 0.1)
      const arbitrageResult = await calculateArbitragesFromPairData(prices)

      for (let arbitrage of arbitrageResult) {
        let doc = new CryptoArbitrageModel({
          cryptocurrency: pair.crypto,
          fiat: pair.fiat,
          askExchange: arbitrage.askExchange,
          askPrice: arbitrage.askPrice,
          bidExchange: arbitrage.bidExchange,
          bidPrice: arbitrage.bidPrice,
          profit: arbitrage.profit,
          time: arbitrage.time
        })

        await doc.save()
      }
    } catch (error) {
      //console.log(error)
      continue
    }
  }
}

export async function collectArbitrages (
  crypto: string,
  fiat: string,
  volume: number
): Promise<ICryptoArbitrageResult[]> {
  try {
    const prices = await pricesByCurrencyPair(crypto, fiat, volume)
    const arbitrageResult = await calculateArbitragesFromPairData(prices)

    return arbitrageResult
  } catch (error) {
    //console.log(error)
    return []
  }
}

async function collectExchangePrices (
  exchangeName: string,
  crypto: string,
  fiat: string
) {
  try {
    const priceCollector = priceCollectorFunctions.get(exchangeName)

    if (priceCollector !== undefined) {
      const askBids = await priceCollector(crypto, fiat)
      const asks: Array<[number, number]> = askBids.asks.map(ask => [
        Number(ask[0]),
        Number(ask[1])
      ])
      const bids: Array<[number, number]> = askBids.bids.map(ask => [
        Number(ask[0]),
        Number(ask[1])
      ])

      return { asks, bids }
    }

    return { asks: [], bids: [] }
  } catch (error) {
    console.log('Error in collectExchangesPricesToBD', error)
    return undefined
  }
}

export async function collectExchangesPricesToBD () {
  try {
    const exchanges = await Exchange.find({})

    for (let exchange of exchanges) {
      if (exchange.pairs.length > 0) {
        for (let pair of exchange.pairs) {
          const prices = await collectExchangePrices(
            exchange.name,
            pair.crypto,
            pair.fiat
          )

          if (prices != undefined) {
            pair.asks = prices.asks
            pair.bids = prices.bids
          }
        }
        await exchange.save()
      }
    }
  } catch (error) {
    //console.log('Error en collectExchangesPricesToBD', error)
  }
}
