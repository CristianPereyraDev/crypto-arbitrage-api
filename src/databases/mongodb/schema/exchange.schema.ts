import { Schema, model } from 'mongoose'
import {
  type IExchange,
  type ICurrencyPair,
  type IAskBid
} from '../model/exchange.model.js'

const askBidSchema = new Schema<IAskBid>(
  {
    time: String,
    ask: Number,
    totalAsk: Number,
    bid: Number,
    totalBid: Number
  },
  { timestamps: true }
)

const currencyPairSchema = new Schema<ICurrencyPair>({
  crypto: { type: String },
  fiat: { type: String },
  prices: [askBidSchema]
})

const schema = new Schema<IExchange>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  pairs: [currencyPairSchema]
})

askBidSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 })
currencyPairSchema.index({ crypto: 1, fiat: 1 }, { unique: true })

export const Exchange = model<IExchange>('Exchange', schema)
