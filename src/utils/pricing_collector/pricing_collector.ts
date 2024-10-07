import { ICryptoArbitrageResult } from '../arbitrages/arbitrage-calculator.js';
import {
  p2pOrderCollectors,
  exchangePriceCollectors,
  brokeragePriceCollectors,
} from '../apis/crypto_exchanges/index.js';
import { ExchangeService } from '../../services/exchanges.service.js';
import { P2PExchange } from '../../databases/mongodb/schema/exchange_p2p.schema.js';
import { currencyPriceCollectors } from '../apis/currency_exchanges/index.js';
import CurrencyService from '../../services/currency.service.js';
import ExchangeRepositoryMongoDB from '../../repository/impl/exchange-repository-mongodb.js';
import BrokerageRepositoryMongoDB from '../../repository/impl/brokerage-repository-mongodb.js';
import { ExchangeP2PRepositoryMongoDB } from '../../repository/impl/exchange-p2p-repository-mongodb.js';
import {
  IExchange,
  IExchangePairPrices,
} from '../../data/model/exchange.model.js';
import { ExchangeBaseRepositoryMongoBD } from '../../repository/impl/exchange-base-repository-mongodb.js';
import {
  P2POrderType,
  P2PUserType,
} from '../../data/model/exchange_p2p.model.js';
import { IBrokeragePairPrices } from '../../data/model/brokerage.model.js';

const exchangeService = new ExchangeService(
  new ExchangeBaseRepositoryMongoBD(),
  new ExchangeRepositoryMongoDB(),
  new BrokerageRepositoryMongoDB(),
  new ExchangeP2PRepositoryMongoDB()
);
const currencyService = new CurrencyService();

// Crypto exchanges prices (USDT-ARS, BTC-ARS, ...)

export async function collectArbitrages(
  crypto: string,
  fiat: string,
  volume: number
): Promise<ICryptoArbitrageResult[]> {
  // try {
  //   const prices = await getBrokeragePairPrices(crypto, fiat, volume)
  //   const arbitrageResult = await calculateArbitragesFromPairData(prices)

  //   return arbitrageResult
  // } catch (error) {
  //   //console.log(error)
  //   return []
  // }
  return [];
}

export async function collectP2POrdersToDB() {
  try {
    const p2pExchanges = await P2PExchange.find({ available: true });

    for (const p2pExchange of p2pExchanges) {
      const orderCollector = p2pOrderCollectors.get(p2pExchange.name);

      if (orderCollector !== undefined) {
        for (const p2pPair of p2pExchange.ordersByPair) {
          // Get all buy orders and all sell orders
          const orders = await Promise.all([
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
          ]);
          exchangeService.updateP2POrders(
            p2pExchange.name,
            p2pPair.crypto,
            p2pPair.fiat,
            P2POrderType.BUY,
            orders[0]
          );
          exchangeService.updateP2POrders(
            p2pExchange.name,
            p2pPair.crypto,
            p2pPair.fiat,
            P2POrderType.SELL,
            orders[1]
          );
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
      const priceCollector = exchangePriceCollectors.get(exchange.name);
      if (priceCollector === undefined) continue;

      collectors.push(
        new Promise<PromiseAllElemResultType>((resolve, reject) => {
          priceCollector(exchange.availablePairs)
            .then((prices) => {
              resolve({
                exchangeName: exchange.name,
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
    const brokerages = await exchangeService.getAvailableBrokerages();
    const collectors: Promise<BrokeragePromiseAllElemResultType>[] = [];

    for (const brokerage of brokerages) {
      const priceCollector = brokeragePriceCollectors.get(brokerage.name);
      if (priceCollector === undefined) continue;

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
