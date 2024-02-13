import { Model, Schema, Types } from 'mongoose'
import {
  type IExchangePairPrices,
  IExchange,
  IAskBid
} from '../../model/exchange.model.js'
import { ExchangeBase } from './exchange_base.schema.js'

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
  IExchangePairPrices,
  Record<string, never>,
  CurrencyPairDocumentProps
>

const cryptoAssetPairSchema = new Schema<
  IExchangePairPrices,
  CurrencyPairModelType
>({
  crypto: { type: String, required: true },
  fiat: { type: String, required: true },
  asksAndBids: [askBidSchema]
})

type ExchangeDocumentProps = {
  pricesByPair: Types.DocumentArray<IExchangePairPrices>
}

type ExchangeModelType = Model<IExchange, Record<string, never>, ExchangeDocumentProps>

const exchangeSchema = new Schema<IExchange, ExchangeModelType>(
  {
    pricesByPair: {
      type: [cryptoAssetPairSchema]
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
