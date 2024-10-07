import { Schema, model } from 'mongoose';
import { IPushSubscription } from '../../../data/model/push_subscription.model.js';

const schema = new Schema<IPushSubscription>({
  endpoint: { type: String, required: true },
  p256dh: { type: String, required: true },
  auth: { type: String, required: true },
  minProfit: { type: Number, default: 0.8 },
  volume: { type: Number, default: 1.0 },
  crypto: { type: String, default: 'USDT' },
  fiat: { type: String, default: 'ARS' },
});

export default model<IPushSubscription>('PushSubscription', schema);
