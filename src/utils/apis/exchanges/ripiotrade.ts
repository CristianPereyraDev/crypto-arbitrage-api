import { CollectorFunctionReturnType } from './index.js'

export async function getPairPrices (
  baseAsset: string,
  quoteAsset: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    const apiResponse = await fetch(
      `https://api.ripiotrade.co/v4/public/orders/level-3?pair=${baseAsset}_${quoteAsset}`
    )

    if (apiResponse.ok) {
      const apiResponseJson: any = await apiResponse.json()

      return {
        asks: apiResponseJson.data.asks.map((ask: any) => [
          ask.price,
          ask.amount
        ]),
        bids: apiResponseJson.data.bids.map((bid: any) => [
          bid.price,
          bid.amount
        ])
      }
    } else {
      return undefined
    }
  } catch (error) {
    console.error('Error ocurred in getPairPrices from ripiotrade', error)
  }
}
