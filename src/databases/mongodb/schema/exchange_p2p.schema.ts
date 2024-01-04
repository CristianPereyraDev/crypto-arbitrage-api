import { Schema } from 'mongoose'
import { IP2PExchange, IP2POrder } from '../model/exchange.model.js'
import { ExchangeBase } from './exchange_base.schema.js'

// Exchange P2P
const p2pOrderSchema = new Schema<IP2POrder>(
  {
    orderId: { type: String },
    merchantId: { type: String },
    merchantName: { type: String },
    volume: { type: Number },
    price: { type: Number },
    min: { type: Number },
    max: { type: Number },
    trades: { type: Number },
    completed: { type: Number },
    payments: [String],
    verified: { type: Boolean },
    link: { type: String }
  },
  { timestamps: true }
)
const p2pExchangeSchema = new Schema<IP2PExchange>(
  { orders: { type: [p2pOrderSchema] } },
  { discriminatorKey: 'exchangeType' }
)
export const ExchangeP2P = ExchangeBase.discriminator<IP2PExchange>(
  'P2PExchange',
  p2pExchangeSchema
)
