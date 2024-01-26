export interface ICryptoArbitrage {
  cryptocurrency: string
  fiat: string
  askExchange: string
  askPrice: number
  bidExchange: string
  bidPrice: number
  profit: number
  time: number
}
