import { Model, Schema, Types } from 'mongoose'
import { ExchangeBase } from './exchange_base.schema.js'
import { IBrokerage, IBrokeragePairPrices } from '../model/exchange.model.js'

const cryptoAssetPairSchema = new Schema<IBrokeragePairPrices>({
  crypto: { type: String, required: true },
  fiat: { type: String, required: true },
  ask: { type: Number, default: 0.0 },
  bid: { type: Number, default: 0.0 }
})

type BrokerageDocumentProps = {
  pricesByPair: Types.DocumentArray<IBrokeragePairPrices>
}

type BrokerageModelType = Model<IBrokerage, {}, BrokerageDocumentProps>

const brokerageSchema = new Schema<IBrokerage, BrokerageModelType>(
  {
    pricesByPair: { type: [cryptoAssetPairSchema] }
  },
  { discriminatorKey: 'exchangeType' }
)

export const Brokerage = ExchangeBase.discriminator<
  IBrokerage,
  BrokerageModelType
>('Brokerage', brokerageSchema)
