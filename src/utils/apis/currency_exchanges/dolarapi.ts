import { CurrencyCollectorFunctionReturnType } from './index.js'

type DolarApiResponseType = {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}[]

export async function getDollarRates (): Promise<
  CurrencyCollectorFunctionReturnType | undefined
> {
  try {
    const apiResponse = await fetch('https://dolarapi.com/v1/dolares')

    if (apiResponse.ok) {
      const apiResponseJson = (await apiResponse.json()) as DolarApiResponseType

      return apiResponseJson.map(dolar => {
        return {
          exchangeSlug: dolar.casa,
          exchangeName: dolar.nombre,
          buy: dolar.compra,
          sell: dolar.venta,
          updatedAt: new Date(dolar.fechaActualizacion)
        }
      })
    } else {
      return undefined
    }
  } catch (error) {
    console.error(error)
    return undefined
  }
}
