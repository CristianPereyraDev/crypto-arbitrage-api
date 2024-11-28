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
import ExchangeRepositoryNodeCache from '../repository/impl/node-cache/exchange-repository-node-cache.js';
import BrokerageRepositoryNodeCache from '../repository/impl/node-cache/brokerage-repository-node-cache.js';
import { ExchangeP2PRepositoryNodeCache } from '../repository/impl/node-cache/exchange-p2p-repository-node-cache.js';

export let exchangeService: ExchangeService;

const pushSubscriptionProvider = new PushSubscriptionProviderMongoDB();

dotenv.config();

const app = express();

appSetup(app)
  .then((setup) => {
    exchangeService = new ExchangeService(
      new ExchangeBaseRepositoryMongoBD(),
      new ExchangeRepositoryNodeCache(setup.nodeCache),
      new BrokerageRepositoryNodeCache(setup.nodeCache),
      new ExchangeP2PRepositoryNodeCache(setup.nodeCache)
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
    }, Number(process.env.PRICING_COLLECTOR_INTERVAL ?? 30000));

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
    }, Number(process.env.PUSH_NOTIFICATIONS_INTERVAL ?? 60000));

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
