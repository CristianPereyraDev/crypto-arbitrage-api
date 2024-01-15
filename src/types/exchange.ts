export interface IExchangePricing {
  exchange: string
  ask: number | null
  totalAsk: number | null
  bid: number | null
  totalBid: number | null
  time: number
}

export type IExchangePairPricing = Map<string, IExchangePricing>

export interface IPairPricing {
  bids: string[][]
  asks: string[][]
}
