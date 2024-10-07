import { Schema } from 'mongoose';
import {
  IP2PExchange,
  IP2POrder,
  IP2PPairOrders,
  IPaymentMethod,
  P2PUserType,
} from '../../../data/model/exchange_p2p.model.js';
import { ExchangeBase } from './exchange_base.schema.js';

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
        name: { type: String, required: true },
      }),
    ],
    merchantId: { type: String, required: true },
    merchantName: { type: String },
    userType: {
      type: String,
      required: true,
      enum: P2PUserType,
      default: P2PUserType.user,
    },
    monthOrderCount: { type: Number },
    monthFinishRate: { type: Number },
    positiveRate: { type: Number },
    link: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const orderPairSchema = new Schema<IP2PPairOrders>({
  crypto: { type: String, required: true },
  fiat: { type: String, required: true },
  buyOrders: [p2pOrderSchema],
  sellOrders: [p2pOrderSchema],
});

const p2pExchangeSchema = new Schema<IP2PExchange>(
  {
    ordersByPair: {
      type: [orderPairSchema],
    },
  },
  { discriminatorKey: 'exchangeType' }
);

export const P2PExchange = ExchangeBase.discriminator<IP2PExchange>(
  'P2PExchange',
  p2pExchangeSchema
);
