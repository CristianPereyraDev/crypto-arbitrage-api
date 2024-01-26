import { getExchangesFees } from '../databases/mongodb/utils/queries.util.js'
import { type IExchangePairPricing } from '../types/exchange.js'
import { IExchangePricingDTO } from 'src/types/dto/index.js'

export interface ICryptoArbitrageResult {
  askExchange: string
  askPrice: number
  bidExchange: string
  bidPrice: number
  profit: number
  time: number
}

export async function calculateArbitragesFromPairData (
  data: IExchangePairPricing | undefined
): Promise<ICryptoArbitrageResult[]> {
  if (data === undefined) return []

  const arbitrages: ICryptoArbitrageResult[] = []

  // Get exchange fees. Se supone que los fees son porcentajes (hay que dividir por 100).
  const fees = await getExchangesFees()

  const exchangesArr: { exchange: string; value: IExchangePricingDTO }[] = []
  data.forEach((value, exchange) => {
    exchangesArr.push({ exchange, value })
  })

  for (let i = 0; i < exchangesArr.length; i++) {
    const askExchange1 = exchangesArr[i].value.ask
    const bidExchange1 = exchangesArr[i].value.bid
    let totalAskExchange1 =
      exchangesArr[i].value.ask !== null ? exchangesArr[i].value.ask : 0
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
      const askExchange2 = exchangesArr[j].value.ask
      const bidExchange2 = exchangesArr[j].value.bid
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
      let [maxBid, maxTotalBid, minAsk, minTotalAsk] = [0, 0, 0, 0]

      if (totalBidExchange1 >= totalBidExchange2) {
        maxBidExchange = exchangesArr[i].exchange
        maxBid = bidExchange1
        maxTotalBid = totalBidExchange1
      } else {
        maxBidExchange = exchangesArr[j].exchange
        maxBid = bidExchange2
        maxTotalBid = totalBidExchange2
      }

      if (totalAskExchange1 <= totalAskExchange2) {
        minAskExchange = exchangesArr[i].exchange
        minAsk = askExchange1
        minTotalAsk = totalAskExchange1
      } else {
        minAskExchange = exchangesArr[j].exchange
        minAsk = askExchange2
        minTotalAsk = totalAskExchange2
      }

      // Check > 0 because some exchanges can have ask price = 0 or bid price = 0
      const profit =
        minAsk > 0 ? ((maxTotalBid - minTotalAsk) / minTotalAsk) * 100 : 0

      if (profit > 0) {
        arbitrages.push({
          askExchange: minAskExchange,
          askPrice: minAsk,
          bidExchange: maxBidExchange,
          bidPrice: maxBid,
          profit: profit,
          time: Math.max(exchangesArr[i].value.time, exchangesArr[j].value.time)
        })
      }
    }
  }

  return arbitrages
}
