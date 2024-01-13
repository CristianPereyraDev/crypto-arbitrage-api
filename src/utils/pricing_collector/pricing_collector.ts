import { Exchange } from '../../databases/mongodb/schema/exchange.schema.js'
import CryptoArbitrageModel from '../../databases/mongodb/schema/arbitrage.schema.js'
import { pricesByCurrencyPair } from '../apis/exchanges/cryptoya.js'
import {
  ICryptoArbitrageResult,
  calculateArbitragesFromPairData
} from '../arbitrage-calculator.js'
import {
  CollectorFunctionReturnType,
  priceCollectorFunctions
} from '../apis/exchanges/index.js'
import { updateExchangePrices } from 'src/services/exchanges.service.js'
import { P2PExchange } from 'src/databases/mongodb/schema/exchange_p2p.schema.js'

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
      console.log(error)
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

type PromiseAllElemResultType = {
  exchangeName: string
  baseAsset: string
  quoteAsset: string
  prices: CollectorFunctionReturnType | undefined
}

export async function collectP2POrdersToBD () {
  try {
    const p2pExchanges = await P2PExchange.find({})
  } catch (error) {}
}

export async function collectExchangesPricesToBD () {
  try {
    const exchanges = await Exchange.find({})
    const collectors: Promise<PromiseAllElemResultType>[] = []

    for (let exchange of exchanges) {
      const priceCollector = priceCollectorFunctions.get(exchange.name)
      if (priceCollector === undefined) continue

      for (let pair of exchange.pricesByPair) {
        collectors.push(
          new Promise<PromiseAllElemResultType>((resolve, _reject) => {
            priceCollector(pair.crypto, pair.fiat).then(prices => {
              resolve({
                exchangeName: exchange.name,
                baseAsset: pair.crypto,
                quoteAsset: pair.fiat,
                prices
              })
            })
          })
        )
      }
    }

    // Call collectors in parallel
    const priceCollectorResults = await Promise.all(collectors)
    for (let priceCollectorResult of priceCollectorResults) {
      if (priceCollectorResult.prices !== undefined) {
        updateExchangePrices(
          priceCollectorResult.exchangeName,
          priceCollectorResult.baseAsset,
          priceCollectorResult.quoteAsset,
          priceCollectorResult.prices
        )
      }
    }
  } catch (error) {
    console.log('Error en collectExchangesPricesToBD', error)
  }
}
