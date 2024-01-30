import { fetchWithTimeout } from '../../../utils/network.utils.js'
import { BrokerageCollectorReturnType } from './index.js'

type CryptoYaAPIResponseType = {
  ask: number
  totalAsk: number
  bid: number
  totalBid: number
  time: number
}

export async function getBrokeragePairPrices (
  asset: string,
  fiat: string,
  exchange: string
): Promise<BrokerageCollectorReturnType | undefined> {
  try {
    const response = await fetchWithTimeout(
      `https://criptoya.com/api/${exchange}/${asset}/${fiat}`
    )

    if (response.ok) {
      const jsonResponse = (await response.json()) as CryptoYaAPIResponseType

      return { ask: jsonResponse.ask, bid: jsonResponse.bid }
    }

    return undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}
