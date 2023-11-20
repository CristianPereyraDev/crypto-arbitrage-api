import { type Document } from 'mongoose'

export interface IAskBid extends Document {
  price: number
  qty: number
}

export interface ICurrencyPair {
  crypto: string
  fiat: string
  bids: [number, number][]
  asks: [number, number][]
}

export interface INetworkFee {
  network: string
  fee: number
}

export interface ICryptoFee {
  crypto: string
  networks: INetworkFee[]
}

export interface IExchange extends Document {
  name: string
  pairs: ICurrencyPair[]
  networkFees: ICryptoFee[] // Represents crypto withdrawal fees. Deposits is supposed to be free.
  depositFiatFee: number
  withdrawalFiatFee: number
  makerFee: number
  takerFee: number
  buyFee: number
  sellFee: number
}
