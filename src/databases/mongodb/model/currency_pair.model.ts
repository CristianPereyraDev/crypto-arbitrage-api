export interface ICurrencyRate {
  exchangeSlug: string
  exchangeName: string
  buy: number
  sell: number
  updatedAt: Date
}

export interface ICurrencyPair {
  base: string
  quote: string
  rates: ICurrencyRate[]
}
