import { type Express, type Request, type Response } from 'express';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSMongoose from '@adminjs/mongoose';
import morgan from 'morgan';

import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

import infoRouter from '../../controllers/info.controller.js';
import arbitragesRouter from '../../controllers/arbitrages.controller.js';
import currenciesController from '../../controllers/currencies.controller.js';
import webpushController from '../../controllers/webpush.controller.js';

import { ExchangeBase } from '../../databases/mongodb/schema/exchange_base.schema.js';
import { Exchange } from '../../databases/mongodb/schema/exchange.schema.js';
import { P2PExchange } from '../../databases/mongodb/schema/exchange_p2p.schema.js';
import { Brokerage } from '../../databases/mongodb/schema/brokerage_schema.js';
import { CurrencyPair } from '../../databases/mongodb/schema/currency_pair.schema.js';

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const authenticate = async (email: string, password: string) => {
  if (
    email === process.env.DEFAULT_ADMIN_EMAIL &&
    password === process.env.DEFAULT_ADMIN_PASSWORD
  ) {
    return Promise.resolve({ email, password });
  }
  return null;
};

const routerSetup = async (app: Express): Promise<Express> => {
  const admin = new AdminJS({
    resources: [
      ExchangeBase,
      {
        resource: Exchange,
        options: {
          properties: {
            'pricesByPair.asksAndBids': {
              isVisible: { edit: false, list: false },
            },
          },
        },
      },
      {
        resource: Brokerage,
      },
      {
        resource: P2PExchange,
        options: {
          properties: {
            ordersByPair: {
              isVisible: {
                edit: false,
                show: false,
                list: false,
                filter: false,
              },
            },
            networkFees: {
              isVisible: {
                edit: false,
                show: false,
                list: false,
                filter: false,
              },
            },
          },
        },
      },
      {
        resource: CurrencyPair,
      },
    ],
  });

  const sessionStore = MongoStore.create({
    client: mongoose.connection.getClient() as unknown as MongoClient,
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'adminjs',
      cookiePassword: process.env.SESSION_SECRET || 'sessionsecret',
    },
    null,
    {
      store: sessionStore,
      resave: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET || 'sessionsecret',
      cookie: {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
      },
      name: 'adminjs',
    }
  );

  return app
    .use(morgan('dev'))
    .get('/', (req: Request, res: Response) => {
      res
        .status(200)
        .send(
          `<h1 style="text-align: center">Welcome to Crypto Arbitrage Api<h1>`
        );
    })
    .use('/api', infoRouter)
    .use('/api/currencies', currenciesController)
    .use('/api/arbitrages', arbitragesRouter)
    .use('/api/webpush', webpushController)
    .use(admin.options.rootPath, adminRouter);
};

export default routerSetup;
