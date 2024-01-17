import { Schema, model } from 'mongoose'
import { ICurrencyPair, ICurrencyRate } from '../model/currency_pair.model.js'

const currencyRateSchema = new Schema<ICurrencyRate>({
  exchangeSlug: { type: String, unique: true, required: true },
  exchangeName: { type: String, required: true },
  buy: { type: Number },
  sell: { type: Number },
  updatedAt: { type: Date, required: true }
})

const currencyPairSchema = new Schema<ICurrencyPair>({
  base: { type: String, required: true },
  quote: { type: String, required: true },
  rates: [currencyRateSchema]
})

export const CurrencyPair = model<ICurrencyPair>(
  'CurrencyPair',
  currencyPairSchema
)
