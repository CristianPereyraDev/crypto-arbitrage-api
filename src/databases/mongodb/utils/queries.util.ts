export enum Cryptocurrency {
  BTC,
  ETH,
  USDT
}

export interface IExchangeFees {
  depositFiatFee: number
  withdrawalFiatFee: number
  makerFee: number
  takerFee: number
  networkFees: { [key: string]: { [key: string]: number } }
  buyFee: number
  sellFee: number
}
