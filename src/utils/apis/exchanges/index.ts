import { getPairPrices } from './argenbtc.js'
import { getSpotAskBidPrices } from './binance.js'
import { getBitgetPairPrices } from './p2p/bitget.js'
import * as bitmonedero from './bitmonedero.js'
import * as cryptomarket from './cryptomarket.js'

export type CollectorFunctionReturnType = { bids: number[][]; asks: number[][] }

export type CollectorFunctionType = (
  baseAsset: string,
  quoteAsset: string
) => Promise<CollectorFunctionReturnType | undefined>

const priceCollectorFunctions = new Map<string, CollectorFunctionType>()

// priceCollectorFunctions.set('Binance', getSpotAskBidPrices)
// priceCollectorFunctions.set('ArgenBTC', getPairPrices)
// priceCollectorFunctions.set('Bitmonedero', bitmonedero.getPairPrices)
// priceCollectorFunctions.set('Bitget', getBitgetPairPrices)
priceCollectorFunctions.set('CryptoMarket', cryptomarket.getPairPrices)

export { priceCollectorFunctions }
