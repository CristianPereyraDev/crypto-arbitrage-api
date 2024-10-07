import { IPushSubscription } from '../../../data/model/push_subscription.model.js';
import { ExchangesFeesType } from '../../../services/exchanges.service.js';
import { IExchangePricingDTO } from '../../../types/dto/index.js';
import { calculateArbitragesFromPairData } from '../../../utils/arbitrages/arbitrage-calculator.js';

import webpush, { PushSubscription } from 'web-push';

webpush.setGCMAPIKey(process.env.PRIVATE_VAPID_KEY || null);
webpush.setVapidDetails(
  'mailto:test@cryptoarbitrage.com',
  process.env.PUBLIC_VAPID_KEY || '',
  process.env.PRIVATE_VAPID_KEY || ''
);

export async function sendNotification(
  prices: IExchangePricingDTO[],
  fees: ExchangesFeesType,
  pushSubscription: IPushSubscription
) {
  if (prices.length > 0) {
    const arbitrages = calculateArbitragesFromPairData(
      prices.map((dto) => ({ exchange: dto.exchange, value: dto })),
      fees,
      { crypto: 'USDT', fiat: 'ARS' },
      pushSubscription.minProfit
    );

    if (arbitrages.length > 0) {
      const payload = JSON.stringify({
        title: 'Posibles Arbitrages',
        message: arbitrages,
      });

      return await webpush.sendNotification(
        {
          endpoint: pushSubscription.endpoint,
          keys: {
            p256dh: pushSubscription.p256dh,
            auth: pushSubscription.auth,
          },
        },
        payload
      );
    }
  }
}
