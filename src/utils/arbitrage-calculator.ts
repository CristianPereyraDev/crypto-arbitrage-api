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
    let totalAskExchange1 = exchangesArr[i].value.ask
    let totalBidExchange1 = exchangesArr[i].value.bid

    const exchangeFees1 = Object.hasOwn(fees, exchangesArr[i].exchange)
      ? fees[exchangesArr[i].exchange]
      : undefined

    if (exchangeFees1 !== undefined) {
      const buyFeeExchange1 = Math.max(
        exchangeFees1.buyFee,
        exchangeFees1.takerFee
      )

      const sellFeeExchange1 = Math.max(
        exchangeFees1.sellFee,
        exchangeFees1.takerFee
      )

      totalAskExchange1 *= 1 + buyFeeExchange1 / 100
      totalBidExchange1 *= 1 - sellFeeExchange1 / 100
    }

    for (let j = i; j < exchangesArr.length; j++) {
      let totalAskExchange2 = exchangesArr[j].value.ask
      let totalBidExchange2 = exchangesArr[j].value.bid

      const exchangeFees2 = Object.hasOwn(fees, exchangesArr[j].exchange)
        ? fees[exchangesArr[j].exchange]
        : undefined

      if (exchangeFees2 !== undefined) {
        const buyFeeExchange2 = Math.max(
          exchangeFees2.buyFee,
          exchangeFees2.takerFee
        )

        const sellFeeExchange2 = Math.max(
          exchangeFees2.sellFee,
          exchangeFees2.takerFee
        )

        totalAskExchange2 *= 1 + buyFeeExchange2 / 100
        totalBidExchange2 *= 1 - sellFeeExchange2 / 100
      }

      let [maxBidExchange, minAskExchange] = ['', '']
      let [maxBid, minAsk] = [0, 0]

      if (totalBidExchange1 >= totalBidExchange2) {
        maxBidExchange = exchangesArr[i].exchange
        maxBid = totalBidExchange1
      } else {
        maxBidExchange = exchangesArr[j].exchange
        maxBid = totalBidExchange2
      }

      if (totalAskExchange1 <= totalAskExchange2) {
        minAskExchange = exchangesArr[i].exchange
        minAsk = totalAskExchange1
      } else {
        minAskExchange = exchangesArr[j].exchange
        minAsk = totalAskExchange2
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
