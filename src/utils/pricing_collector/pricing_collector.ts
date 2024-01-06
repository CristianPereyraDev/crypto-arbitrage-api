import { Exchange } from '../../databases/mongodb/schema/exchange.schema.js'
import CryptoArbitrageModel from '../../databases/mongodb/schema/arbitrage.schema.js'
import { pricesByCurrencyPair } from '../apis/exchanges/cryptoya.js'
import {
  ICryptoArbitrageResult,
  calculateArbitragesFromPairData
} from '../arbitrage-calculator.js'
import { priceCollectorFunctions } from '../apis/exchanges/index.js'
import { updateExchangePrices } from 'src/services/exchanges.service.js'

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

export async function collectExchangesPricesToBD () {
  priceCollectorFunctions.forEach(async (collector, exchangeName) => {
    try {
      const exchangeDoc = await Exchange.findOne({ name: exchangeName })

      if (exchangeDoc !== null) {
        exchangeDoc.availablePairs.forEach(availablePair => {
          collector(availablePair.crypto, availablePair.fiat).then(prices => {
            if (prices !== undefined) {
              updateExchangePrices(
                exchangeName,
                availablePair.crypto,
                availablePair.fiat,
                prices
              )
            }
          })
        })
      }
    } catch (error) {
      console.log('Error en collectExchangesPricesToBD', error)
    }
  })
}
