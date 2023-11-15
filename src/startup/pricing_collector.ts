import CryptoArbitrageModel from '../databases/mongodb/schema/arbitrage.schema.js'
import { pricesByCurrencyPair } from '../utils/apis/cryptoya.js'
import { calculateArbitragesFromPairData } from '../utils/arbitrage-calculator.js'

export const currencyPairs = [
  { crypto: 'MATIC', fiat: 'ARS' },
  { crypto: 'BTC', fiat: 'ARS' },
  { crypto: 'ETH', fiat: 'ARS' },
  { crypto: 'USDT', fiat: 'ARS' },
  { crypto: 'MANA', fiat: 'ARS' }
]

export async function arbitrageCollector (): Promise<void> {
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
          profit: arbitrage.profitPercentage,
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
