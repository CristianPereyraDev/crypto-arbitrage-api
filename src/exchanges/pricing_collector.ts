import {
  p2pOrderCollectors,
  exchangePriceCollectors,
  brokeragePriceCollectors,
  brokeragePriceCollectorMulti,
} from './operations/adapters/providers/price_collectors/crypto_exchanges/index.js';
import { ExchangeService } from './services/exchanges.service.js';
import { currencyPriceCollectors } from './operations/adapters/providers/price_collectors/currency_exchanges/index.js';
import CurrencyService from './services/currency.service.js';
import ExchangeRepositoryMongoDB from '../repository/impl/exchange-repository-mongodb.js';
import BrokerageRepositoryMongoDB from '../repository/impl/brokerage-repository-mongodb.js';
import { ExchangeP2PRepositoryMongoDB } from '../repository/impl/exchange-p2p-repository-mongodb.js';
import {
  IExchange,
  IExchangePairPrices,
} from '../data/model/exchange.model.js';
import { ExchangeBaseRepositoryMongoBD } from '../repository/impl/exchange-base-repository-mongodb.js';
import { P2POrderType, P2PUserType } from '../data/model/exchange_p2p.model.js';
import {
  IBrokerage,
  IBrokeragePairPrices,
} from '../data/model/brokerage.model.js';
import { reduceAvailablePairs } from './operations/exchange-utils.js';

const exchangeService = new ExchangeService(
  new ExchangeBaseRepositoryMongoBD(),
  new ExchangeRepositoryMongoDB(),
  new BrokerageRepositoryMongoDB(),
  new ExchangeP2PRepositoryMongoDB()
);
const currencyService = new CurrencyService();

export async function collectP2POrdersToDB() {
  console.log('Hello, here from collectP2POrdersToBD');
  try {
    const p2pExchanges = await exchangeService.getAvailableP2PExchanges();
    console.log(`${p2pExchanges.map((e) => e.name)}`);

    for (const p2pExchange of p2pExchanges) {
      const orderCollector = p2pOrderCollectors.get(p2pExchange.slug);

      if (orderCollector !== undefined) {
        for (const p2pPair of p2pExchange.availablePairs) {
          // Get all buy orders and all sell orders
          Promise.all([
            orderCollector(
              p2pPair.crypto,
              p2pPair.fiat,
              P2POrderType.BUY,
              P2PUserType.merchant
            ),
            orderCollector(
              p2pPair.crypto,
              p2pPair.fiat,
              P2POrderType.SELL,
              P2PUserType.merchant
            ),
          ])
            .then((orders) => {
              exchangeService.updateP2POrders(
                p2pExchange.slug,
                p2pPair.crypto,
                p2pPair.fiat,
                P2POrderType.BUY,
                orders[0]
              );
              exchangeService.updateP2POrders(
                p2pExchange.slug,
                p2pPair.crypto,
                p2pPair.fiat,
                P2POrderType.SELL,
                orders[1]
              );
            })
            .catch((reason) => console.log(reason));
        }
      }
    }
  } catch (error) {
    console.log('Error in collectP2POrdersToBD', error);
  }
}

type PromiseAllElemResultType = {
  exchangeName: string;
  prices: IExchangePairPrices[] | undefined;
};

export async function collectCryptoExchangesPricesToDB() {
  try {
    const exchanges: IExchange[] =
      await exchangeService.getAvailableExchanges();
    const collectors: Promise<PromiseAllElemResultType>[] = [];

    for (const exchange of exchanges) {
      const priceCollector = exchangePriceCollectors.get(exchange.slug);
      if (priceCollector === undefined) continue;

      collectors.push(
        new Promise<PromiseAllElemResultType>((resolve, reject) => {
          priceCollector(exchange.availablePairs)
            .then((prices) => {
              resolve({
                exchangeName: exchange.slug,
                prices,
              });
            })
            .catch((reason) => reject(reason));
        })
      );
    }

    // Call collectors in parallel
    const priceCollectorResults = await Promise.allSettled(collectors);
    for (const priceCollectorResult of priceCollectorResults) {
      if (
        priceCollectorResult.status === 'fulfilled' &&
        priceCollectorResult.value.prices
      ) {
        exchangeService.updateExchangePrices(
          priceCollectorResult.value.exchangeName,
          priceCollectorResult.value.prices
        );
      } else if (priceCollectorResult.status === 'rejected') {
        console.error(priceCollectorResult.reason);
      }
    }
  } catch (error) {
    console.error('There was an error in collectExchangesPricesToBD:', error);
  }
}

type BrokeragePromiseAllElemResultType = {
  exchangeName: string;
  prices: IBrokeragePairPrices[] | undefined;
};

export async function collectCryptoBrokeragesPricesToDB() {
  try {
    const availableBrokerages = await exchangeService.getAvailableBrokerages();
    console.log(availableBrokerages.map((b) => b.slug));
    const collectors: Promise<BrokeragePromiseAllElemResultType>[] = [];
    const brokeragesMulti: IBrokerage[] = [];

    for (const brokerage of availableBrokerages) {
      const priceCollector = brokeragePriceCollectors.get(brokerage.slug);
      if (priceCollector === undefined) {
        brokeragesMulti.push(brokerage);
        continue;
      }

      collectors.push(
        new Promise<BrokeragePromiseAllElemResultType>((resolve, reject) => {
          priceCollector(brokerage.availablePairs)
            .then((prices) => {
              resolve({
                exchangeName: brokerage.name,
                prices,
              });
            })
            .catch((reason) => reject(reason));
        })
      );
    }

    // Call collectors in parallel
    const priceCollectorResults = await Promise.allSettled(collectors);
    for (const priceCollectorResult of priceCollectorResults) {
      if (
        priceCollectorResult.status === 'fulfilled' &&
        priceCollectorResult.value.prices !== undefined
      ) {
        exchangeService.updateBrokeragePrices(
          priceCollectorResult.value.exchangeName
            .toLowerCase()
            .replace(' ', ''),
          priceCollectorResult.value.prices
        );
      } else if (priceCollectorResult.status === 'rejected') {
        console.error(priceCollectorResult.reason);
      }
    }

    // Get prices for all brokerages that has not defined a collector.
    brokeragePriceCollectorMulti(
      brokeragesMulti.map((b) => b.name),
      reduceAvailablePairs(brokeragesMulti)
    )
      .then((prices) => {
        for (const e of prices.entries()) {
          exchangeService.updateBrokeragePrices(e[0], e[1]);
        }
      })
      .catch((reason) =>
        console.error(
          'There was an error in brokeragePriceCollectorMulti:',
          reason
        )
      );
  } catch (error) {
    console.error(
      'There was an error in collectCryptoBrokeragesPricesToDB:',
      error
    );
  }
}

// Currency exchanges prices (USD-ARS, USD-EUR, ...)

export async function collectCurrencyExchangesPricesToDB() {
  currencyPriceCollectors.forEach((collector, symbol) => {
    const [currencyBase, currencyQuote] = symbol.split('-');
    collector()
      .then((rates) => {
        if (rates !== undefined) {
          currencyService.updateCurrencyPairRate(
            currencyBase,
            currencyQuote,
            rates
          );
        }
      })
      .catch((reason) => console.error(reason));
  });
}
