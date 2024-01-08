import mongoose, { Model, Schema, Types } from 'mongoose'
import {
  type ICurrencyPairPrices,
  IExchange,
  IAskBid
} from '../model/exchange.model.js'
import { ExchangeBase } from './exchange_base.schema.js'

//mongoose.set('debug', true)

// Exchange
const askBidSchema = new Schema<IAskBid>(
  {
    asks: { type: [[Number]], required: true },
    bids: { type: [[Number]], required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Override CurrencyPair document props
type CurrencyPairDocumentProps = {
  asksAndBids: Types.DocumentArray<IAskBid>
}

type CurrencyPairModelType = Model<
  ICurrencyPairPrices,
  {},
  CurrencyPairDocumentProps
>

const currencyPairSchema = new Schema<
  ICurrencyPairPrices,
  CurrencyPairModelType
>({
  crypto: { type: String, required: true },
  fiat: { type: String, required: true },
  asksAndBids: [askBidSchema]
})

type ExchangeDocumentProps = {
  pricesByPair: Types.DocumentArray<ICurrencyPairPrices>
}

type ExchangeModelType = Model<IExchange, {}, ExchangeDocumentProps>

const exchangeSchema = new Schema<IExchange, ExchangeModelType>(
  {
    pricesByPair: {
      type: [currencyPairSchema]
    }
  },
  {
    discriminatorKey: 'exchangeType'
  }
)

export const Exchange = ExchangeBase.discriminator<
  IExchange,
  ExchangeModelType
>('Exchange', exchangeSchema)
