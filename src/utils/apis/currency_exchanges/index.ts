import { ICurrencyRate } from 'src/databases/mongodb/model/currency_pair.model.js'
import * as dolarapi from './dolarapi.js'

export type CurrencyCollectorFunctionReturnType = ICurrencyRate[]

export type CurrencyCollectorFunctionType = () => Promise<
  CurrencyCollectorFunctionReturnType | undefined
>

const currencyPriceCollectors = new Map<string, CurrencyCollectorFunctionType>()

currencyPriceCollectors.set('USD-ARS', dolarapi.getDollarRates) // Implemented

export { currencyPriceCollectors }
