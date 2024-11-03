import { Router } from 'express';
import { PushSubscription } from 'web-push';

import { PushSubscriptionProviderMongoDB } from '../../operations/adapters/providers/push-subscription-provider-mongodb.js';

const pushSubscriptionProvider = new PushSubscriptionProviderMongoDB();

const controller = Router();

let pushSubscription: PushSubscription & {
  minProfit?: number;
  volume?: number;
  crypto?: string;
  fiat?: string;
};

controller.post('/subscription', async (req, res) => {
  pushSubscription = req.body;

  try {
    await pushSubscriptionProvider.addSubscription({
      endpoint: pushSubscription.endpoint,
      p256dh: pushSubscription.keys.p256dh,
      auth: pushSubscription.keys.auth,
      minProfit: pushSubscription.minProfit,
      volume: pushSubscription.volume,
      crypto: pushSubscription.crypto,
      fiat: pushSubscription.fiat,
    });

    res.status(201).json({ message: 'Subscription added successfully.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to subscribe.' });
  }
});

controller.post('/unsubscribe', async (req, res) => {
  pushSubscription = req.body;

  try {
    await pushSubscriptionProvider.removeSubscription({
      endpoint: pushSubscription.endpoint,
      p256dh: pushSubscription.keys.p256dh,
      auth: pushSubscription.keys.auth,
    });

    res.status(201).json({ message: 'Subscription removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unsubscribe.' });
  }
});

export default controller;
