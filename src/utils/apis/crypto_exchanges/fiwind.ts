import { CollectorFunctionReturnType } from './index.js'

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
): Promise<CollectorFunctionReturnType | undefined> {
  try {
    const response = await fetch('https://api.fiwind.io/v1.0/prices/list')

    if (response.ok) {
      const jsonResponse = (await response.json()) as FiwindAPIResponseType
      const pairData = jsonResponse.find(
        pairData => pairData.s === asset.toUpperCase() + fiat.toUpperCase()
      )

      if (pairData !== undefined) {
        return {
          asks: [[pairData.buy, 1]],
          bids: [[pairData.sell, 1]]
        }
      }
    }

    return undefined
  } catch (error) {
    console.log(error)
    return undefined
  }
}
