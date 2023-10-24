import CryptoArbitrageModel from '../databases/mongodb/schema/arbitrage.schema.js'
import { pricesByCurrencyPair } from '../utils/apis/cryptoya.js'
import { calculateGreatestProfit } from '../utils/arbitrage-calculator.js'

export const currencyPairs = [
  { crypto: 'BTC', fiat: 'ARS' },
  { crypto: 'ETH', fiat: 'ARS' },
  { crypto: 'USDT', fiat: 'ARS' },
  { crypto: 'BTC', fiat: 'USD' },
  { crypto: 'ETH', fiat: 'USD' },
  { crypto: 'USDT', fiat: 'USD' }
]

export async function pricingCollector (): Promise<void> {
  for (const pair of currencyPairs) {
    try {
      const prices = await pricesByCurrencyPair(pair.crypto, pair.fiat, 0.1)
      const arbitrageResult = calculateGreatestProfit(prices)

      const doc = new CryptoArbitrageModel({
        cryptocurrency: pair.crypto,
        fiat: pair.fiat,
        askExchange: arbitrageResult.askExchange,
        askPrice: arbitrageResult.askPrice,
        bidExchange: arbitrageResult.bidExchange,
        bidPrice: arbitrageResult.bidPrice,
        profit: arbitrageResult.profitPercentage,
        time: arbitrageResult.time
      })

      await doc.save()
    } catch (error) {
      console.log(error)
      continue
    }
  }
}
