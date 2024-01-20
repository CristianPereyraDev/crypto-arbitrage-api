import { fetchWithTimeout } from 'src/utils/network.utils.js'
import { CollectorFunctionReturnType } from './index.js'

export async function getPairPrices (
  baseAsset: string,
  quoteAsset: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    let asks: number[][] = []
    let bids: number[][] = []

    const responseBTCFiat = await fetchWithTimeout(
      `https://sandbox.bitso.com/api/v3/order_book/?book=btc_ars`
    )

    if (responseBTCFiat.ok) {
      const jsonResponseBTCFiat: any = await responseBTCFiat.json()

      switch (baseAsset) {
        case 'BTC':
          asks = jsonResponseBTCFiat.payload.asks.map((ask: any) => [
            parseFloat(ask.price),
            parseFloat(ask.amount)
          ])
          bids = jsonResponseBTCFiat.payload.bids.map((bid: any) => [
            parseFloat(bid.price),
            parseFloat(bid.amount)
          ])
          break
        default:
          const responseAssetFiat = await fetch(
            `https://sandbox.bitso.com/api/v3/ticker/?book=btc_${baseAsset.toLowerCase()}`
          )

          if (responseAssetFiat.ok) {
            const jsonResponseBTCAsset: any = await responseAssetFiat.json()
            const priceBTCAsset = parseFloat(jsonResponseBTCAsset.payload.bid)

            asks = jsonResponseBTCFiat.payload.asks.map((ask: any) => [
              parseFloat(ask.price) / priceBTCAsset,
              parseFloat(ask.amount)
            ])
            bids = jsonResponseBTCFiat.payload.bids.map((bid: any) => [
              parseFloat(bid.price) / priceBTCAsset,
              parseFloat(bid.amount)
            ])
          } else {
            return undefined
          }
      }

      return {
        asks,
        bids
      }
    } else {
      return undefined
    }
  } catch (error) {
    console.error(error)
    return undefined
  }
}
