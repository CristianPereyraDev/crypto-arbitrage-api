import { type Document } from 'mongoose'

export interface ICryptoArbitrage extends Document {
  cryptocurrency: string
  fiat: string
  askExchange: string
  askPrice: number
  bidExchange: string
  bidPrice: number
  profit: number
  time: number
}
