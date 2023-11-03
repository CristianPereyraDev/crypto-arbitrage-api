import { getExchangesFees } from '../databases/mongodb/utils/queries.util.js'
import { type IExchangePairPricing } from './apis/cryptoya.js'

export interface ICryptoArbitrageResult {
  askExchange: string
  askPrice: number
  bidExchange: string
  bidPrice: number
  profitPercentage: number
  time: number
}

export async function calculateGreatestProfit (
  data: IExchangePairPricing | undefined
): Promise<ICryptoArbitrageResult> {
  const minAsk = { price: Number.POSITIVE_INFINITY, exchange: '', time: 0 }
  const maxBid = { price: 0, exchange: '', time: 0 }

  // Get exchange fees.
  const fees = await getExchangesFees()

  for (let exchange in data) {
    const takerFee = Object.hasOwn(fees, exchange) ? fees[exchange].makerFee : 0
    const totalAsk = data[exchange].ask + (takerFee * data[exchange].ask) / 100
    const totalBid = data[exchange].bid - (takerFee * data[exchange].bid) / 100

    if (totalAsk < minAsk.price) {
      minAsk.price = totalAsk
      minAsk.exchange = exchange
      minAsk.time = data[exchange].time
    }
    if (totalBid > maxBid.price) {
      maxBid.price = totalBid
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
