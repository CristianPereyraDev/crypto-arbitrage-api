/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-unused-vars */
import BrokerageRepositoryMongoDB from '../../repository/impl/brokerage-repository-mongodb.js';
import ExchangeRepositoryMongoDB from '../../repository/impl/exchange-repository-mongodb.js';
import { ExchangeP2PRepositoryMongoDB } from '../../repository/impl/exchange-p2p-repository-mongodb.js';
import {
  ExchangeService,
  type ExchangesFeesType,
} from '../../services/exchanges.service.js';
import {
  CryptoP2PWebSocketConfig,
  CryptoPairWebSocketConfig,
  P2POutgoingMessage,
} from '../types.js';
import CurrencyService from '../../services/currency.service.js';
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

  const cryptoPairMsgConfig = new Map<string, CryptoPairWebSocketConfig>();
  const cryptoP2PMsgConfig = new Map<string, CryptoP2PWebSocketConfig>();

  let fees: ExchangesFeesType;
  let includeFees = false;
  exchangeService
    .getAllFees()
    .then((value) => {
      fees = value;
    })
    .catch(() => {
      fees = {};
    });

  const exchangePricesTimeout = setInterval(() => {
    cryptoPairMsgConfig.forEach((value, key) => {
      makeCryptoMessage(
        key.split('-')[0],
        key.split('-')[1],
        value.volume,
        fees,
        includeFees
      ).then((msg) => websocket.send(msg));
    });
  }, 1000 * 6);

  const p2pOrdersTimeout = setInterval(() => {
    cryptoP2PMsgConfig.forEach((msgConfig, p2pConfigKey) => {
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
      cryptoPairMsgConfig.set(
        `${parsedMessage.crypto.asset}-${parsedMessage.crypto.fiat}`,
        { volume: parsedMessage.crypto.volume }
      );
    } else if (Object.hasOwn(parsedMessage, 'p2p')) {
      cryptoP2PMsgConfig.set(
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
    } else if (Object.hasOwn(parsedMessage, 'currency')) {
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
    } else if (Object.hasOwn(parsedMessage, 'HEADERS')) {
      const headers = parsedMessage.HEADERS;
      if (headers['HX-Trigger'] === 'form-settings') {
        includeFees = Object.hasOwn(parsedMessage, 'includeFees');
      }
    }
  });
}

export async function makeCryptoMessage(
  asset: string,
  fiat: string,
  volume: number,
  fees?: ExchangesFeesType,
  includeFees = true
) {
  const prices: IExchangePricingDTO[] =
    await exchangeService.getAllExchangesPricesBySymbol(asset, fiat, volume);
  const pricesWithFees =
    fees && includeFees
      ? prices.map((price) => {
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
        })
      : prices;

  return JSON.stringify({
    asset: asset,
    fiat: fiat,
    prices: pricesWithFees,
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
