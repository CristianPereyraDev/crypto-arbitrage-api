import { CollectorFunctionReturnType } from './index.js'

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    let asks: number[][] = []
    let bids: number[][] = []

    const responseBTCFiat = await fetch(
      `https://api.exchange.cryptomkt.com/api/3/public/orderbook/BTCARS`
    )
    const responseAssetFiat = await fetch(
      `https://api.exchange.cryptomkt.com/api/3/public/price/rate?from=BTC&to=${asset}`
    )

    if (responseBTCFiat.ok && responseAssetFiat.ok) {
      const jsonResponseBTCFiat: any = await responseBTCFiat.json()
      const jsonResponseBTCAsset: any = await responseAssetFiat.json()
      const priceBTCAsset = Number(jsonResponseBTCAsset['BTC'].price)

      switch (asset) {
        case 'BTC':
          asks = jsonResponseBTCFiat.ask
          bids = jsonResponseBTCFiat.bid
          break
        default:
          asks = jsonResponseBTCFiat.ask.map((ask: string[]) => [
            Number(ask[0]) / priceBTCAsset,
            parseFloat(ask[1])
          ])
          bids = jsonResponseBTCFiat.bid.map((bid: string[]) => [
            Number(bid[0]) / priceBTCAsset,
            parseFloat(bid[1])
          ])
      }

      return {
        asks,
        bids
      }
    } else {
      return undefined
    }
  } catch (error) {
    console.log(error)
    return undefined
  }
}
