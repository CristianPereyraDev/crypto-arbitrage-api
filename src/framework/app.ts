import dotenv from 'dotenv';
import express from 'express';
import { CronJob } from 'cron';

import appSetup from './startup/init.js';
import routerSetup from './startup/router.js';
import securitySetup from './startup/security.js';
import {
  collectCryptoBrokeragesPricesToDB,
  collectCryptoExchangesPricesToDB,
  collectCurrencyExchangesPricesToDB,
  collectP2POrdersToDB,
} from '../exchanges/pricing_collector.js';
import websocketSetup from '../websocket/index.js';
import { ExchangeService } from '../exchanges/services/exchanges.service.js';
import { ExchangeBaseRepositoryMongoBD } from '../repository/impl/mongodb/exchange-base-repository-mongodb.js';
import { sendNotification } from '../operations/push_notifications/adapters/push_notification.js';
import { PushSubscriptionProviderMongoDB } from '../operations/adapters/providers/push-subscription-provider-mongodb.js';
import { ExchangeP2PRepositoryRedis } from '../repository/impl/redis/exchange-p2p-repository-redis.js';
import BrokerageRepositoryRedis from '../repository/impl/redis/brokerage-repository-redis.js';
import ExchangeRepositoryRedis from '../repository/impl/redis/exchange-repository-redis.js';

export let exchangeService: ExchangeService;

const pushSubscriptionProvider = new PushSubscriptionProviderMongoDB();

dotenv.config();

const app = express();

appSetup(app)
  .then((setup) => {
    exchangeService = new ExchangeService(
      new ExchangeBaseRepositoryMongoBD(),
      new ExchangeRepositoryRedis(setup.redis),
      new BrokerageRepositoryRedis(setup.redis),
      new ExchangeP2PRepositoryRedis(setup.redis)
    );

    securitySetup(app, express);
    routerSetup(app);
    websocketSetup(setup.server);

    // Crypto rates collector interval
    setInterval(() => {
      collectCryptoExchangesPricesToDB().catch((reason) => console.log(reason));
      collectCryptoBrokeragesPricesToDB().catch((reason) =>
        console.log(reason)
      );
      collectP2POrdersToDB().catch((reason) => console.log(reason));
    }, Number(process.env.PRICING_COLLECTOR_INTERVAL ?? 1000 * 6));

    // Push notifications interval
    setInterval(async () => {
      try {
        const prices = await exchangeService.getAllExchangesPricesBySymbol(
          'USDT',
          'ARS'
        );
        const fees = await exchangeService.getAllFees();

        const pushSubscriptions =
          await pushSubscriptionProvider.getAllSubscriptions();

        if (prices.length > 0) {
          for (const subs of pushSubscriptions) {
            sendNotification(prices, fees, subs).catch((reason) =>
              console.log(reason)
            );
          }
        }
      } catch (error) {
        console.log(error);
      }
    }, 1000 * 60);

    // Currency rates collector
    const currencyJob = new CronJob(
      '*/5 * * * *',
      () => {
        collectCurrencyExchangesPricesToDB().catch((reason) =>
          console.log(reason)
        );
      },
      null,
      false,
      'America/Argentina/Buenos_Aires'
    );
    currencyJob.start();
  })
  .catch((reason) => {
    console.log(reason);
  });
