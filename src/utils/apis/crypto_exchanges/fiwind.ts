import { fetchWithTimeout } from 'src/utils/network.utils.js'
import { BrokerageCollectorReturnType } from './index.js'

export type FiwindAPIResponseType = {
  s: string
  buy: number
  sell: number
  variation: number
  ts: number // Timestamp
}[]

export async function getPairPrices (
  asset: string,
  fiat: string
): Promise<BrokerageCollectorReturnType | undefined> {
  try {
    const response = await fetchWithTimeout(
      'https://api.fiwind.io/v1.0/prices/list'
    )

    if (response.ok) {
      const jsonResponse = (await response.json()) as FiwindAPIResponseType
      const pairData = jsonResponse.find(
        pairData => pairData.s === asset.toUpperCase() + fiat.toUpperCase()
      )

      if (pairData !== undefined) {
        return {
          ask: pairData.buy,
          bid: pairData.sell
        }
      }
    }

    return undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}
