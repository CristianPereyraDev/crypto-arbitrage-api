import { IExchangeBase, IPair } from './exchange_base.model.js'

export interface IBrokeragePairPrices extends IPair {
  ask: number
  bid: number
}

export interface IBrokerage extends IExchangeBase {
  pricesByPair: IBrokeragePairPrices[]
}
