export type CurrencyExchangeRateType = {
  from: string
  to: string
  name: string
  slug: string
  buy: number
  sell: number
  updateAt: Date
}

type DolarApiResponseType = {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}[]

export async function getDollarRates (): Promise<
  CurrencyExchangeRateType[] | undefined
> {
  try {
    const apiResponse = await fetch('https://dolarapi.com/v1/dolares')

    if (apiResponse.ok) {
      const apiResponseJson = (await apiResponse.json()) as DolarApiResponseType

      return apiResponseJson.map(dolar => {
        return {
          from: dolar.moneda,
          to: 'ARS',
          name: dolar.nombre,
          slug: dolar.casa,
          buy: dolar.compra,
          sell: dolar.venta,
          updateAt: new Date(dolar.fechaActualizacion)
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
