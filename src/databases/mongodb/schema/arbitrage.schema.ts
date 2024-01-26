import { Schema, model } from 'mongoose'
import { type ICryptoArbitrage } from '../../model/arbitrage.model.js'

const schema = new Schema<ICryptoArbitrage>(
  {
    cryptocurrency: { type: String, required: true },
    fiat: { type: String, required: true },
    askExchange: { type: String, required: true },
    askPrice: { type: Number, required: true },
    bidExchange: { type: String, required: true },
    bidPrice: { type: Number, required: true },
    profit: { type: Number, required: true },
    time: { type: Number, required: true }
  },
  { timestamps: true }
)

schema.index(
  {
    cryptocurrency: 1,
    fiat: 1,
    askExchange: 1,
    bidExchange: 1,
    profit: 1,
    time: 1
  },
  { unique: true }
)
schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 })

export default model<ICryptoArbitrage>('CryptoArbitrage', schema)
