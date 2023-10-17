import { Schema, model } from 'mongoose'
import { type IExchange, type ICurrencyPair } from '../model/exchange.model'

const currencyPairSchema = new Schema<ICurrencyPair>({
  crypto: { type: String },
  fiat: { type: String },
  prices: [{ time: Number, price: Number }]
})

const schema = new Schema<IExchange>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  available_cryptocurrencies: [{ type: String }],
  available_fiats: [{ type: String }],
  pairs: [currencyPairSchema]
})

export default model<IExchange>('Exchange', schema)
