import { CollectorFunctionReturnType } from './index.js'

export type SatoshiTangoDataType = {
  [baseAsset: string]: {
    date: string
    timestamp: number
    bid: number
    ask: number
    high: number
    low: number
    volume: number
    change: number
  }
}

export async function getPairPrices (
  baseAsset: string,
  quoteAsset: string
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    const response = await fetch(
      `https://api.satoshitango.com/v3/ticker/${quoteAsset}`
    )

    if (response.ok) {
      const jsonResponse: any = await response.json()
      const data: SatoshiTangoDataType = jsonResponse.data.ticker
      const pairData = data[baseAsset.toUpperCase()]

      if (pairData !== undefined) {
        return {
          asks: [[pairData.ask, 1]],
          bids: [[pairData.bid, 1]]
        }
      }
    }

    return undefined
  } catch (error) {
    console.log(error)
    return undefined
  }
}
