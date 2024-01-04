import { getPairPrices } from './argenbtc.js'
import { getSpotAskBidPrices } from './binance.js'
import * as bitmonedero from './bitmonedero.js'

export type CollectorFunction = (
  baseAsset: string,
  quoteAsset: string
) => Promise<{ bids: string[][]; asks: string[][] } | undefined>

const priceCollectorFunctions = new Map<string, CollectorFunction>()

priceCollectorFunctions.set('Binance', getSpotAskBidPrices)
priceCollectorFunctions.set('ArgenBTC', getPairPrices)
priceCollectorFunctions.set('Bitmonedero', bitmonedero.getPairPrices)

export { priceCollectorFunctions }
