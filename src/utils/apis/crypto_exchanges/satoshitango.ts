import { fetchWithTimeout } from '../../../utils/network.utils.js'
import { BrokerageCollectorReturnType } from './index.js'

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
): Promise<BrokerageCollectorReturnType | undefined> {
  try {
    const response = await fetchWithTimeout(
      `https://api.satoshitango.com/v3/ticker/${quoteAsset}`
    )

    if (response.ok) {
      const jsonResponse: any = await response.json()
      const data: SatoshiTangoDataType = jsonResponse.data.ticker
      const pairData = data[baseAsset.toUpperCase()]

      if (pairData !== undefined) {
        return {
          ask: pairData.ask,
          bid: pairData.bid
        }
      }
    }

    return undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}
