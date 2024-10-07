import { IPushSubscription } from '../../../data/model/push_subscription.model.js';
import { IPushSubscriptionProvider } from '../interfaces/push-subscription-provider.js';

import PushSubscriptionModel from '../../../databases/mongodb/schema/push_subscription.schema.js';

export class PushSubscriptionProviderMongoDB
  implements IPushSubscriptionProvider
{
  async addSubscription(newSubscription: IPushSubscription): Promise<void> {
    await PushSubscriptionModel.deleteMany({
      p256dh: newSubscription.p256dh,
    });

    const newDocument = new PushSubscriptionModel(newSubscription);

    await newDocument.save();
  }

  async removeSubscription(subscription: IPushSubscription): Promise<void> {
    await PushSubscriptionModel.deleteMany({ p256dh: subscription.p256dh });
  }

  async getAllSubscriptions(): Promise<IPushSubscription[]> {
    const subscriptions = await PushSubscriptionModel.find({}).exec();

    return subscriptions;
  }
}
