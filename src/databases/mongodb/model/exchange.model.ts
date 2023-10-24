import { type Document } from 'mongoose'

export interface IAskBid extends Document {
  time: number
  ask: number
  totalAsk: number
  bid: number
  totalBid: number
}

export interface ICurrencyPair extends Document {
  crypto: string
  fiat: string
  prices: IAskBid[]
}

export interface IExchange extends Document {
  name: string
  pairs: ICurrencyPair[]
}
