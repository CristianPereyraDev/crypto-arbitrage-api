import { IPushSubscription } from '../../../data/model/push_subscription.model.js';

export interface IPushSubscriptionProvider {
  addSubscription(newSubscription: IPushSubscription): Promise<void>;
  removeSubscription(subscription: IPushSubscription): Promise<void>;
  getAllSubscriptions(): Promise<IPushSubscription[]>;
}
