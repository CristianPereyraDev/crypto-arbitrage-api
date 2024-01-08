import { CollectorFunctionReturnType } from './index.js'

export async function getPairPrices (
  baseAsset: string,
  quoteAsset: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    const apiResponse = await fetch(
      `https://api.mexo.io/openapi/quote/v1/option/depth?symbol=${baseAsset}${quoteAsset}`
    )

    if (apiResponse.ok) {
      const apiResponseJson: any = await apiResponse.json()

      return {
        asks: apiResponseJson.asks.map((ask: string[]) => [
          parseFloat(ask[0]),
          parseFloat(ask[1])
        ]),
        bids: apiResponseJson.bids.map((bid: string[]) => [
          parseFloat(bid[0]),
          parseFloat(bid[1])
        ])
      }
    } else {
      return undefined
    }
  } catch (error) {
    console.error(
      'An error on getPairPrices from trubit has ocurred: %s',
      error
    )
  }
}
