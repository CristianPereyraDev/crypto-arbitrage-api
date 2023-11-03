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
): Promise<ICryptoArbitrageResult[]> {
  const minAsk = { price: Number.POSITIVE_INFINITY, exchange: '', time: 0 }
  const maxBid = { price: 0, exchange: '', time: 0 }

  const arbitrages: ICryptoArbitrageResult[] = []

  // Get exchange fees.
  const fees = await getExchangesFees()

  for (let exchange1 in data) {
    const takerFee1 = Object.hasOwn(fees, exchange1)
      ? fees[exchange1].makerFee
      : 0
    const totalAsk1 =
      data[exchange1].ask + (takerFee1 * data[exchange1].ask) / 100
    const totalBid1 =
      data[exchange1].bid - (takerFee1 * data[exchange1].bid) / 100

    for (let exchange2 in data) {
      const takerFee2 = Object.hasOwn(fees, exchange2)
        ? fees[exchange2].makerFee
        : 0
      const totalAsk2 =
        data[exchange2].ask + (takerFee2 * data[exchange2].ask) / 100
      const totalBid2 =
        data[exchange2].bid - (takerFee2 * data[exchange2].bid) / 100

      let maxBidExchange = ''
      let maxBid = 0
      let minAskExchange = ''
      let minAsk = 0
      if (totalBid1 >= totalBid2) {
        maxBidExchange = exchange1
        maxBid = totalBid1
      } else {
        maxBidExchange = exchange2
        maxBid = totalBid2
      }

      if (totalAsk1 <= totalAsk2) {
        minAskExchange = exchange1
        minAsk = totalAsk1
      } else {
        minAskExchange = exchange2
        minAsk = totalAsk2
      }

      const profit = ((maxBid - minAsk) / minAsk) * 100

      if (profit > 0) {
        arbitrages.push({
          askExchange: minAskExchange,
          askPrice: minAsk,
          bidExchange: maxBidExchange,
          bidPrice: maxBid,
          profitPercentage: profit,
          time: Math.max(data[maxBidExchange].time, data[minAskExchange].time)
        })
      }
    }
  }

  return arbitrages
}
