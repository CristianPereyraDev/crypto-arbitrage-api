import { Schema } from 'mongoose'
import {
  IP2PExchange,
  IP2POrder,
  IPaymentMethod
} from '../model/exchange.model.js'
import { ExchangeBase } from './exchange_base.schema.js'

const p2pOrderSchema = new Schema<IP2POrder>(
  {
    orderType: { type: String, required: true, enum: ['BUY', 'SELL'] },
    orderId: { type: String, required: true },
    volume: { type: Number, required: true },
    price: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    payments: [
      new Schema<IPaymentMethod>({
        slug: { type: String, required: true },
        name: { type: String, required: true }
      })
    ],
    merchantId: { type: String, required: true },
    merchantName: { type: String, required: true },
    userType: { type: String, required: true, enum: ['user', 'merchant'] },
    monthOrderCount: { type: Number },
    monthFinishRate: { type: Number },
    positiveRate: { type: Number },
    link: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const p2pExchangeSchema = new Schema<IP2PExchange>(
  {
    ordersByPair: {
      type: [
        new Schema({
          crypto: { type: String, required: true },
          fiat: { type: String, required: true },
          buyOrders: [p2pOrderSchema],
          sellOrders: [p2pOrderSchema]
        })
      ]
    }
  },
  { discriminatorKey: 'exchangeType' }
)

export const P2PExchange = ExchangeBase.discriminator<IP2PExchange>(
  'P2PExchange',
  p2pExchangeSchema
)
