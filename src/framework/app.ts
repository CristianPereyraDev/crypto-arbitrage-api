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
} from '../utils/pricing_collector/pricing_collector.js';
import websocketSetup from '../websocket/index.js';
import { ExchangeService } from '../services/exchanges.service.js';
import { ExchangeBaseRepositoryMongoBD } from '../repository/impl/exchange-base-repository-mongodb.js';
import ExchangeRepositoryMongoDB from '../repository/impl/exchange-repository-mongodb.js';
import BrokerageRepositoryMongoDB from '../repository/impl/brokerage-repository-mongodb.js';
import { ExchangeP2PRepositoryMongoDB } from '../repository/impl/exchange-p2p-repository-mongodb.js';
import { sendNotification } from '../operations/push_notifications/adapters/push_notification.js';
import { PushSubscriptionProviderMongoDB } from '../operations/adapters/providers/push-subscription-provider-mongodb.js';

const exchangeService = new ExchangeService(
  new ExchangeBaseRepositoryMongoBD(),
  new ExchangeRepositoryMongoDB(),
  new BrokerageRepositoryMongoDB(),
  new ExchangeP2PRepositoryMongoDB()
);

const pushSubscriptionProvider = new PushSubscriptionProviderMongoDB();

dotenv.config();

const app = express();

appSetup(app)
  .then((server) => {
    securitySetup(app, express);
    routerSetup(app);
    websocketSetup(server);

    // Crypto rates collector interval
    setInterval(() => {
      collectCryptoExchangesPricesToDB().catch((reason) => console.log(reason));
      collectCryptoBrokeragesPricesToDB().catch((reason) =>
        console.log(reason)
      );
      collectP2POrdersToDB().catch((reason) => console.log(reason));
    }, Number(process.env.PRICING_COLLECTOR_INTERVAL ?? 1000 * 6));

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
