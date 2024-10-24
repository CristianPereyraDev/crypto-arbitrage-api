/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-unused-vars */
import BrokerageRepositoryMongoDB from '../../repository/impl/brokerage-repository-mongodb.js';
import ExchangeRepositoryMongoDB from '../../repository/impl/exchange-repository-mongodb.js';
import { ExchangeP2PRepositoryMongoDB } from '../../repository/impl/exchange-p2p-repository-mongodb.js';
import {
  ExchangeService,
  type ExchangesFeesType,
} from '../../exchanges/services/exchanges.service.js';
import {
  CryptoP2PWebSocketConfig,
  CryptoPairWebSocketConfig,
  P2POutgoingMessage,
} from '../types.js';
import CurrencyService from '../../exchanges/services/currency.service.js';
import {
  ArbitrageCalculator,
  calculateTotalAsk,
  calculateTotalBid,
} from '../../utils/arbitrages/arbitrage-calculator.js';
import { IExchangePricingDTO } from '../../types/dto/index.js';

import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { ExchangeBaseRepositoryMongoBD } from '../../repository/impl/exchange-base-repository-mongodb.js';
import { IPair } from '../../data/model/exchange_base.model.js';
import { P2PUserType } from '../../data/model/exchange_p2p.model.js';
import { P2PArbitrageResult } from '../../utils/arbitrages/p2p_strategies/types.js';
import { MatiStrategy } from '../../utils/arbitrages/p2p_strategies/strategy_mati.js';

const exchangeService = new ExchangeService(
  new ExchangeBaseRepositoryMongoBD(),
  new ExchangeRepositoryMongoDB(),
  new BrokerageRepositoryMongoDB(),
  new ExchangeP2PRepositoryMongoDB()
);

const currencyService = new CurrencyService();

export async function wsNativeConnectionHandler(
  websocket: WebSocket,
  connectionRequest: IncomingMessage
) {
  const arbitrageCalculator = new ArbitrageCalculator(new MatiStrategy());
  let currencyRatesTimeout: ReturnType<typeof setInterval>;
  let exchangePricesTimeout: ReturnType<typeof setInterval>;

  const cryptoPairConfig = new Map<string, CryptoPairWebSocketConfig>();
  const cryptoPairP2PConfig = new Map<string, CryptoP2PWebSocketConfig>();

  let fees: ExchangesFeesType | null = null;

  exchangeService
    .getAllFees()
    .then((value) => {
      fees = value;

      sendAllConfiguredMessages();
      exchangePricesTimeout = setInterval(() => {
        sendAllConfiguredMessages();
      }, 1000 * 6);
    })
    .catch((reason) => {
      console.log('error:', reason);
      websocket.close(1011, "Exchanges's fees could not be obtained.");
    });

  const sendAllConfiguredMessages = () => {
    cryptoPairConfig.forEach((value, key) => {
      sendCryptoMessage(
        key.split('-')[0],
        key.split('-')[1],
        value.volume,
        value.includeFees ? fees : undefined
      );
    });
  };

  const sendCryptoMessage = (
    asset: string,
    fiat: string,
    volume: number,
    fees?: ExchangesFeesType | null
  ) => {
    makeJSONCryptoMessage(asset, fiat, volume, fees).then((msg) =>
      websocket.send(msg)
    );
  };

  const p2pOrdersTimeout = setInterval(() => {
    cryptoPairP2PConfig.forEach((msgConfig, p2pConfigKey) => {
      const exchangeName = p2pConfigKey.split('/')[0];
      const pair: IPair = {
        crypto: p2pConfigKey.split('/')[1].split('-')[0],
        fiat: p2pConfigKey.split('/')[1].split('-')[1],
      };
      exchangeService.getP2POrders(exchangeName, pair).then((orders) => {
        if (orders) {
          const computedArbitrage: P2PArbitrageResult =
            arbitrageCalculator.calculateP2PArbitrage({
              buyOrders: orders.buyOrders,
              sellOrders: orders.sellOrders,
              volume: msgConfig.volume,
              minProfit: msgConfig.minProfit,
              userType: msgConfig.userType,
              sellLimits: msgConfig.sellLimits,
              buyLimits: msgConfig.buyLimits,
              nickName: msgConfig.nickName,
              maxBuyOrderPosition: msgConfig.maxBuyOrderPosition,
              maxSellOrderPosition: msgConfig.maxSellOrderPosition,
            });
          const message: P2POutgoingMessage = {
            p2p: {
              arbitrage: computedArbitrage.arbitrage,
              exchange: exchangeName,
              crypto: pair.crypto,
              fiat: pair.fiat,
              totalBuyOrders: orders.buyOrders.length,
              totalSellOrders: orders.sellOrders.length,
              buyOrders: computedArbitrage.buyOrders,
              sellOrders: computedArbitrage.sellOrders,
            },
          };

          websocket.send(JSON.stringify(message));
        }
      });
    });
  }, 1000 * 6);

  websocket.on('error', (error) => {
    console.log('An error has ocurred in the websocket: %s', error);
    clearInterval(exchangePricesTimeout);
    clearInterval(currencyRatesTimeout);
    clearInterval(p2pOrdersTimeout);
  });

  websocket.on('close', () => {
    console.log('The client has been closed the connection');
    clearInterval(exchangePricesTimeout);
    clearInterval(currencyRatesTimeout);
    clearInterval(p2pOrdersTimeout);
  });

  websocket.on('message', (message) => {
    const parsedMessage = JSON.parse(message.toString());

    if (Object.hasOwn(parsedMessage, 'crypto')) {
      const { asset, fiat, volume, includeFees } = parsedMessage.crypto;

      if (Number.isNaN(Number(volume))) {
        websocket.send(JSON.stringify({ error: 'Volume format error.' }));
        return;
      }

      cryptoPairConfig.set(`${asset}-${fiat}`, { volume, includeFees });

      if (includeFees && fees === null) {
        return;
      }

      sendCryptoMessage(asset, fiat, volume, includeFees ? fees : undefined);

      return;
    }

    if (Object.hasOwn(parsedMessage, 'p2p')) {
      cryptoPairP2PConfig.set(
        `${parsedMessage.p2p.exchange}/${parsedMessage.p2p.asset}-${parsedMessage.p2p.fiat}`,
        {
          minProfit: parsedMessage.p2p.minProfit ?? 1,
          volume: parsedMessage.p2p.volume ?? 1,
          userType: Object.hasOwn(parsedMessage.p2p, 'userType')
            ? parsedMessage.p2p.userType
            : P2PUserType.merchant,
          sellLimits: Object.hasOwn(parsedMessage.p2p, 'sellLimits')
            ? parsedMessage.p2p.sellLimits
            : [100000, 100000],
          buyLimits: Object.hasOwn(parsedMessage.p2p, 'buyLimits')
            ? parsedMessage.p2p.buyLimits
            : [100, 100000],
          nickName: parsedMessage.p2p.nickName,
          maxBuyOrderPosition: parsedMessage.p2p.maxBuyOrderPosition ?? 500,
          maxSellOrderPosition: parsedMessage.p2p.maxSellOrderPosition ?? 500,
        }
      );

      return;
    }

    if (Object.hasOwn(parsedMessage, 'currency')) {
      clearInterval(currencyRatesTimeout);

      makeCurrencyPairMessage(
        parsedMessage.currency.base,
        parsedMessage.currency.quote
      ).then((msg) => websocket.send(msg));

      currencyRatesTimeout = setInterval(() => {
        makeCurrencyPairMessage(
          parsedMessage.currency.base,
          parsedMessage.currency.quote
        ).then((msg) => websocket.send(msg));
      }, 1000 * 60);

      return;
    }
  });
}

export async function makeJSONCryptoMessage(
  asset: string,
  fiat: string,
  volume: number,
  fees?: ExchangesFeesType | null
) {
  let prices: IExchangePricingDTO[] =
    await exchangeService.getAllExchangesPricesBySymbol(asset, fiat, volume);

  if (fees) {
    prices = prices.map((price) => {
      const exchangeFees =
        fees[price.exchange.replaceAll(' ', '').toLocaleLowerCase()];

      if (exchangeFees !== undefined) {
        return {
          ...price,
          totalAsk: calculateTotalAsk({
            baseAsk: price.ask,
            fees: exchangeFees,
            includeDepositFiatFee: false,
          }),
          totalBid: calculateTotalBid({
            baseBid: price.bid,
            fees: exchangeFees,
            includeWithdrawalFiatFee: false,
          }),
        };
      }
      return price;
    });
  }

  return JSON.stringify({
    asset: asset,
    fiat: fiat,
    prices: prices,
  });
}

async function makeCurrencyPairMessage(
  currencyBase: string,
  currencyQuote: string
) {
  const rates = await currencyService.getCurrencyPairRates(
    currencyBase,
    currencyQuote
  );

  return JSON.stringify({
    currencyBase,
    currencyQuote,
    rates: rates !== undefined ? rates : [],
  });
}
