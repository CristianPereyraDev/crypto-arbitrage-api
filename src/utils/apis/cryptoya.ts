import { IExchangePairPricing, IExchangePricing } from 'types/exchange.js'

export async function pricesByCurrencyPair (
  crypto: string,
  fiat: string,
  volume: number | undefined
): Promise<IExchangePairPricing> {
  try {
    const response = await fetch(
      `https://criptoya.com/api/${crypto}/${fiat}/${volume ?? ''}`
    )

    if (response.ok) {
      const jsonResponse = await response.json()

      return new Map<string, IExchangePricing>(Object.entries(jsonResponse))
    } else {
      throw new Error(
        `An error has ocurred during the request to the API: ${response.statusText}`
      )
    }
  } catch (error) {
    throw new Error('Error al hacer una petición a la api')
  }
}
