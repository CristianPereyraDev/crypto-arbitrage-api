import { fetchWithTimeout } from '../../../utils/network.utils.js'
import { IExchangePairPricing } from '../../../types/exchange.js'
import { IExchangePricingDTO } from '../../../types/dto/index.js'

export async function pricesByCurrencyPair (
  crypto: string,
  fiat: string,
  volume: number | undefined
): Promise<IExchangePairPricing> {
  try {
    const response = await fetchWithTimeout(
      `https://criptoya.com/api/${crypto}/${fiat}/${volume ?? ''}`
    )

    if (response.ok) {
      const jsonResponse: any = await response.json()

      return new Map<string, IExchangePricingDTO>(Object.entries(jsonResponse))
    } else {
      throw new Error(
        `An error has ocurred during the request to the API: ${response.statusText}`
      )
    }
  } catch (error) {
    throw new Error('Error al hacer una petición a la api')
  }
}
