import { IAskBid } from 'databases/mongodb/model/exchange.model.js'
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

export async function calculateArbitragesFromPairData (
  data: IExchangePairPricing | undefined
): Promise<ICryptoArbitrageResult[]> {
  if (data === undefined) return []

  const arbitrages: ICryptoArbitrageResult[] = []

  // Get exchange fees.
  const fees = await getExchangesFees()

  const exchangesArr: { exchange: string; value: IAskBid }[] = []
  data.forEach((value, exchange) => {
    exchangesArr.push({ exchange, value })
  })

  for (let i = 0; i < exchangesArr.length; i++) {
    const takerFee1 = Object.hasOwn(fees, exchangesArr[i].exchange)
      ? fees[exchangesArr[i].exchange].takerFee
      : 0
    const totalAsk1 =
      exchangesArr[i].value.ask + (takerFee1 * exchangesArr[i].value.ask) / 100
    const totalBid1 =
      exchangesArr[i].value.bid - (takerFee1 * exchangesArr[i].value.bid) / 100

    for (let j = i; j < exchangesArr.length; j++) {
      const takerFee2 = Object.hasOwn(fees, exchangesArr[j].exchange)
        ? fees[exchangesArr[j].exchange].takerFee
        : 0
      const totalAsk2 =
        exchangesArr[j].value.ask +
        (takerFee2 * exchangesArr[j].value.ask) / 100
      const totalBid2 =
        exchangesArr[j].value.bid -
        (takerFee2 * exchangesArr[j].value.bid) / 100

      let [maxBidExchange, minAskExchange] = ['', '']
      let [maxBid, minAsk] = [0, 0]

      if (totalBid1 >= totalBid2) {
        maxBidExchange = exchangesArr[i].exchange
        maxBid = totalBid1
      } else {
        maxBidExchange = exchangesArr[j].exchange
        maxBid = totalBid2
      }

      if (totalAsk1 <= totalAsk2) {
        minAskExchange = exchangesArr[i].exchange
        minAsk = totalAsk1
      } else {
        minAskExchange = exchangesArr[j].exchange
        minAsk = totalAsk2
      }

      // Check > 0 because some exchanges can have ask price = 0 or bid price = 0
      const profit = minAsk > 0 ? ((maxBid - minAsk) / minAsk) * 100 : 0

      if (profit > 0) {
        arbitrages.push({
          askExchange: minAskExchange,
          askPrice: minAsk,
          bidExchange: maxBidExchange,
          bidPrice: maxBid,
          profitPercentage: profit,
          time: Math.max(exchangesArr[i].value.time, exchangesArr[j].value.time)
        })
      }
    }
  }

  return arbitrages
}
