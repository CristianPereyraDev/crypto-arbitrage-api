import { Schema, model } from 'mongoose'
import {
  type IExchange,
  type ICurrencyPair,
  type IAskBid,
  ICryptoFee
} from '../model/exchange.model.js'

const askBidSchema = new Schema<IAskBid>(
  {
    time: { type: Number, required: true },
    ask: { type: Number, required: true },
    totalAsk: { type: Number, required: true },
    bid: { type: Number, required: true },
    totalBid: { type: Number, required: true }
  },
  { timestamps: true }
)

const currencyPairSchema = new Schema<ICurrencyPair>({
  crypto: { type: String, required: true },
  fiat: { type: String, required: true },
  prices: [askBidSchema]
})

const cryptoFeeSchema = new Schema<ICryptoFee>({
  crypto: { type: String, required: true },
  networks: [{ network: String, fee: Number }]
})

const exchangeSchema = new Schema<IExchange>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  pairs: {
    type: [currencyPairSchema],
    validate: {
      validator: function (v: any) {
        const set = new Set(v.map((pair: any) => `${pair.crypto}-${pair.fiat}`))

        return set.size === v.length
      },
      message: 'Repeated pairs is not allowed.'
    }
  },
  networkFees: { type: [cryptoFeeSchema] },
  depositFiatFee: { type: Number, default: 0 },
  withdrawalFiatFee: { type: Number, default: 0 },
  makerFee: { type: Number, default: 0 },
  takerFee: { type: Number, default: 0 },
  buyFee: { type: Number, default: 0 },
  sellFee: { type: Number, default: 0 }
})

askBidSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 })

export const Exchange = model<IExchange>('Exchange', exchangeSchema)
