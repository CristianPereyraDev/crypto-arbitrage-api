import BrokerageRepositoryMongoDB from '../../repository/impl/brokerage-repository-mongodb.js';
import ExchangeRepositoryMongoDB from '../../repository/impl/exchange-repository-mongodb.js';
import { ExchangeP2PRepositoryMongoDB } from '../../repository/impl/exchange-p2p-repository-mongodb.js';
import { ExchangeBaseRepositoryMongoBD } from '../../repository/impl/exchange-base-repository-mongodb.js';
import {
  ExchangeService,
  ExchangesFeesType,
} from '../../exchanges/services/exchanges.service.js';
import { CryptoPairWebSocketConfig } from '../types.js';
import CurrencyService from '../../exchanges/services/currency.service.js';
import {
  calculateTotalAsk,
  calculateTotalBid,
} from '../../utils/arbitrages/arbitrage-calculator.js';
import { IExchangePricingDTO } from '../../types/dto/index.js';

import { WebSocket } from 'ws';
import pug from 'pug';
import path from 'path';
import {
  sortPricesByAsk,
  sortPricesByBid,
} from '../../exchanges/operations/sort-prices.js';

const exchangeService = new ExchangeService(
  new ExchangeBaseRepositoryMongoBD(),
  new ExchangeRepositoryMongoDB(),
  new BrokerageRepositoryMongoDB(),
  new ExchangeP2PRepositoryMongoDB()
);
const currencyService = new CurrencyService();

export async function wsWebConnectionHandler(websocket: WebSocket) {
  const cryptoPairConfig = new Map<string, CryptoPairWebSocketConfig>();
  let currencyRatesTimeout: ReturnType<typeof setInterval>;
  let exchangePricesTimeout: ReturnType<typeof setInterval>;
  let fees: ExchangesFeesType | null = null;

  exchangeService
    .getAllFees()
    .then((value) => {
      fees = value;

      sendAllConfiguredMessages();
      exchangePricesTimeout = setInterval(() => {
        sendAllConfiguredMessages();
      }, 1000 * 60);
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
    compileCryptoMessage(asset, fiat, volume, fees).then((msg) =>
      websocket.send(msg)
    );
  };

  websocket.on('error', (error) => {
    console.log('An error has ocurred in the websocket: %s', error);
    clearInterval(exchangePricesTimeout);
    clearInterval(currencyRatesTimeout);
  });

  websocket.on('close', () => {
    console.log('The client has been closed the connection');
    clearInterval(exchangePricesTimeout);
    clearInterval(currencyRatesTimeout);
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

    if (Object.hasOwn(parsedMessage, 'currency')) {
      clearInterval(currencyRatesTimeout);

      compileCurrencyPairMessage(
        parsedMessage.currency.base,
        parsedMessage.currency.quote
      ).then((msg) => websocket.send(msg));

      currencyRatesTimeout = setInterval(() => {
        compileCurrencyPairMessage(
          parsedMessage.currency.base,
          parsedMessage.currency.quote
        ).then((msg) => websocket.send(msg));
      }, 1000 * 60);
    }
  });
}

async function compileCryptoMessage(
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

  const __dirname = new URL('.', import.meta.url).pathname;

  const template = pug.compileFile(
    path.resolve(__dirname, '../../views/symbol_prices.pug')
  );

  return template({
    asset: asset,
    fiat: fiat,
    volume: volume,
    includeFees: fees !== null && fees !== undefined,
    pricesSortedByAsk: sortPricesByAsk([...prices]),
    pricesSortedByBid: sortPricesByBid([...prices]),
  });
}

async function compileCurrencyPairMessage(
  currencyBase: string,
  currencyQuote: string
) {
  const rates = await currencyService.getCurrencyPairRates(
    currencyBase,
    currencyQuote
  );

  const __dirname = new URL('.', import.meta.url).pathname;

  const template = pug.compileFile(
    path.resolve(__dirname, '../../views/currency_pair_prices.pug')
  );

  return template({
    currencyBase,
    currencyQuote,
    rates: rates !== undefined ? rates : [],
  });
}
