import * as argenbtc from './argenbtc.js'
import { getSpotAskBidPrices } from './binance.js'
import { getBitgetPairPrices } from './p2p/bitget.js'
import * as bitmonedero from './bitmonedero.js'
import * as cryptomarket from './cryptomarket.js'
import * as ripiotrade from './ripiotrade.js'

/**
 * bids & asks are arrays like -> [[price, qty], [price, qty], ...]
 */
export type CollectorFunctionReturnType = { bids: number[][]; asks: number[][] }

export type CollectorFunctionType = (
  baseAsset: string,
  quoteAsset: string
) => Promise<CollectorFunctionReturnType | undefined>

const priceCollectorFunctions = new Map<string, CollectorFunctionType>()

//priceCollectorFunctions.set('Binance', getSpotAskBidPrices) // Implemented
//priceCollectorFunctions.set('ArgenBTC', argenbtc.getPairPrices) // Implemented
//priceCollectorFunctions.set('Bitmonedero', bitmonedero.getPairPrices) // Implemented
//priceCollectorFunctions.set('Bitget', getBitgetPairPrices) // Not implemented
//priceCollectorFunctions.set('CryptoMarket', cryptomarket.getPairPrices) // Implemented
//priceCollectorFunctions.set('Ripio Trade', ripiotrade.getPairPrices) // Implemented

export { priceCollectorFunctions }
