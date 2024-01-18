export interface IExchangePricing {
  exchange: string
  exchangeLogoURL: string
  ask: number
  totalAsk: number
  bid: number
  totalBid: number
  time: number
}

export type IExchangePairPricing = Map<string, IExchangePricing>

export interface IPairPricing {
  bids: string[][]
  asks: string[][]
}
