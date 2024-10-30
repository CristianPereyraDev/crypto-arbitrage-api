import { APIError } from '../../../../../../types/errors/index.js';
import { fetchWithTimeout } from '../../../../../../utils/network.utils.js';
import { CurrencyCollectorFunctionReturnType } from './index.js';

type DolarApiResponseType = {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
};

export async function getDollarRates(): Promise<
  CurrencyCollectorFunctionReturnType | undefined
> {
  try {
    const apiResponse = await fetchWithTimeout(
      'https://dolarapi.com/v1/dolares'
    );

    if (apiResponse.ok) {
      const apiResponseJson =
        (await apiResponse.json()) as DolarApiResponseType[];

      return apiResponseJson.map((dolar) => {
        return {
          exchangeSlug: dolar.casa,
          exchangeName:
            dolar.nombre === 'Contado con liquidación' ? 'CCL' : dolar.nombre,
          buy: dolar.compra,
          sell: dolar.venta,
          updatedAt: new Date(dolar.fechaActualizacion),
        };
      });
    }

    return undefined;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function getEuroRates(): Promise<
  CurrencyCollectorFunctionReturnType | undefined
> {
  try {
    const response = await fetchWithTimeout(
      'https://dolarapi.com/v1/cotizaciones/eur'
    );

    if (!response.ok) {
      throw new APIError(
        'https://dolarapi.com/v1/cotizaciones/eur',
        'DolarAPI',
        response.statusText
      );
    }

    const apiResponseJson = (await response.json()) as DolarApiResponseType;

    return [
      {
        exchangeSlug: apiResponseJson.casa,
        exchangeName: apiResponseJson.nombre,
        buy: apiResponseJson.compra,
        sell: apiResponseJson.venta,
        updatedAt: new Date(apiResponseJson.fechaActualizacion),
      },
    ];
  } catch (error) {
    if (!(error instanceof APIError)) {
      throw new Error(
        "Euro rates can't be fetched from https://dolarapi.com/v1/cotizaciones/eur"
      );
    }

    throw error;
  }
}
