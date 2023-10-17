import { type IAskBid } from '../../databases/mongodb/model/exchange.model'

export type IExchangePairPricing = Record<string, IAskBid>

export async function pricesByCurrencyPair (
  crypto: string,
  fiat: string,
  volume: number
): Promise<IExchangePairPricing> {
  try {
    const response = await fetch(
      `https://criptoya.com/api/${crypto}/${fiat}/${volume}`
    )
    const jsonResponse = (await response.json()) as IExchangePairPricing

    return jsonResponse
  } catch (error) {
    throw new Error('Error al hacer una petición a la api')
  }
}
