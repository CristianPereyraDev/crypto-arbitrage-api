import { Schema, model } from 'mongoose'
import { ICryptoFee, IExchangeBase, IPair } from '../model/exchange.model.js'

const pairSchema = new Schema<IPair>({
  crypto: { type: String, required: true },
  fiat: { type: String, required: true }
})

const cryptoFeeSchema = new Schema<ICryptoFee>({
  crypto: { type: String, required: true },
  networks: [{ network: String, fee: Number }]
})

const exchangeBaseSchema = new Schema<IExchangeBase>(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    logoURL: { type: String },
    depositFiatFee: { type: Number, default: 0 },
    withdrawalFiatFee: { type: Number, default: 0 },
    makerFee: { type: Number, default: 0 },
    takerFee: { type: Number, default: 0 },
    buyFee: { type: Number, default: 0 },
    sellFee: { type: Number, default: 0 },
    networkFees: { type: [cryptoFeeSchema] },
    availablePairs: {
      type: [pairSchema],
      validate: {
        validator: function (v: any) {
          const set = new Set(
            v.map((pair: any) => `${pair.crypto}-${pair.fiat}`)
          )

          return set.size === v.length
        },
        message: 'Repeated pairs is not allowed.'
      }
    }
  },
  {
    discriminatorKey: 'exchangeType'
  }
)

export const ExchangeBase = model<IExchangeBase>(
  'ExchangeBase',
  exchangeBaseSchema
)
