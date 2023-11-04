import { type IAskBid } from '../../databases/mongodb/model/exchange.model.js'

export type IExchangePairPricing = Map<string, IAskBid>

export async function pricesByCurrencyPair (
  crypto: string,
  fiat: string,
  volume: number
): Promise<IExchangePairPricing> {
  try {
    const response = await fetch(
      //`https://criptoya.com/api/${crypto}/${fiat}/${volume}`
      `https://criptoya.com/api/${crypto}/${fiat}/`
    )

    if (response.ok) {
      const jsonResponse = (await response.json()) as IExchangePairPricing

      return jsonResponse
    } else {
      throw new Error(
        `An error has ocurred during the request to the API: ${response.statusText}`
      )
    }
  } catch (error) {
    throw new Error('Error al hacer una petición a la api')
  }
}
