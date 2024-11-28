import { ICurrencyRate } from '../../../../../../data/model/currency_pair.model.js';
import * as dolarapi from './dolarapi.js';

export type CurrencyCollectorFunctionReturnType = ICurrencyRate[];

export type CurrencyCollectorFunctionType = () => Promise<
  CurrencyCollectorFunctionReturnType | undefined
>;

const currencyPriceCollectors = new Map<
  string,
  CurrencyCollectorFunctionType
>();

currencyPriceCollectors.set('USD-ARS', dolarapi.getDollarRates);
currencyPriceCollectors.set('EUR-ARS', () => dolarapi.getRates('eur'));
currencyPriceCollectors.set('BRL-ARS', () => dolarapi.getRates('brl'));
currencyPriceCollectors.set('CLP-ARS', () => dolarapi.getRates('clp'));
currencyPriceCollectors.set('UYU-ARS', () => dolarapi.getRates('uyu'));

export { currencyPriceCollectors };
