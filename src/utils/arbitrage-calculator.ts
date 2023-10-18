import { type IExchangePairPricing } from './apis/cryptoya'

export interface ICryptoArbitrageResult {
  askExchange: string
  askPrice: number
  bidExchange: string
  bidPrice: number
  profitPercentage: number
  time: number
}

export function calculateGreatestProfit (
  data: IExchangePairPricing | undefined
): ICryptoArbitrageResult {
  const minAsk = { price: Number.POSITIVE_INFINITY, exchange: '', time: 0 }
  const maxBid = { price: 0, exchange: '', time: 0 }

  for (const exchange in data) {
    if (data[exchange].totalAsk < minAsk.price) {
      minAsk.price = data[exchange].totalAsk
      minAsk.exchange = exchange
      minAsk.time = data[exchange].time
    }
    if (data[exchange].totalBid > maxBid.price) {
      maxBid.price = data[exchange].totalBid
      maxBid.exchange = exchange
      maxBid.time = data[exchange].time
    }
  }

  return {
    askExchange: minAsk.exchange,
    askPrice: minAsk.price,
    bidExchange: maxBid.exchange,
    bidPrice: maxBid.price,
    profitPercentage: ((maxBid.price - minAsk.price) / minAsk.price) * 100,
    time: Math.max(maxBid.time, minAsk.time)
  }
}
