import { type ExchangesFeesType } from '../../exchanges/services/exchanges.service.js';
import {
  P2PArbitrageWebSocketConfig,
  CrossArbitrageWebSocketConfig,
  P2POutgoingMessage,
  P2PArbitrageWebSocketIncomingMessage,
} from '../types.js';
import CurrencyService from '../../exchanges/services/currency.service.js';
import {
  ArbitrageCalculator,
  calculateTotalAsk,
  calculateTotalBid,
} from '../../arbitrages/arbitrage-calculator.js';
import {
  IExchangePricingDTO,
  IExchangePricingTotalDTO,
} from '../../data/dto/index.js';

import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { IPair } from '../../data/model/exchange_base.model.js';
import { P2PUserType } from '../../data/model/exchange_p2p.model.js';
import { P2PArbitrageResult } from '../../arbitrages/p2p_strategies/types.js';
import { MatiStrategy } from '../../arbitrages/p2p_strategies/strategy_mati.js';
import { exchangeService } from '../../framework/app.js';

const currencyService = new CurrencyService();

export async function wsNativeConnectionHandler(
  websocket: WebSocket,
  connectionRequest: IncomingMessage
) {
  const arbitrageCalculator = new ArbitrageCalculator(new MatiStrategy());
  let currencyRatesTimeout: ReturnType<typeof setInterval>;
  let exchangePricesTimeout: ReturnType<typeof setInterval>;

  const crossArbitrageConfig = new Map<string, CrossArbitrageWebSocketConfig>();
  const p2pArbitrageConfig = new Map<string, P2PArbitrageWebSocketConfig>();

  let fees: ExchangesFeesType | null = null;

  exchangeService
    .getAllFees()
    .then((value) => {
      fees = value;

      sendAllConfiguredMessages();
      exchangePricesTimeout = setInterval(() => {
        sendAllConfiguredMessages();
      }, 10000);
    })
    .catch((reason) => {
      console.log('error:', reason);
      websocket.close(1011, "Exchanges's fees could not be obtained.");
    });

  const sendAllConfiguredMessages = () => {
    crossArbitrageConfig.forEach((value, key) => {
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
    p2pArbitrageConfig.forEach((msgConfig, p2pConfigKey) => {
      console.log(p2pConfigKey);
      const exchangeSlug = p2pConfigKey.split('_')[0];
      const symbolSplitted = p2pConfigKey.split('_')[1].split('-');

      const pair: IPair = {
        crypto: symbolSplitted[0],
        fiat: symbolSplitted[1],
      };

      makeJSONP2PMessage(
        exchangeSlug,
        pair,
        msgConfig,
        arbitrageCalculator
      ).then((msg) => websocket.send(msg));
    });
  }, 11000);

  websocket.on('error', (error) => {
    console.log('An error has occurred in the websocket: %s', error);
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

      crossArbitrageConfig.set(`${asset}-${fiat}`, { volume, includeFees });

      if (includeFees && fees === null) {
        return;
      }

      sendCryptoMessage(asset, fiat, volume, includeFees ? fees : undefined);

      return;
    }

    if (Object.hasOwn(parsedMessage, 'p2p')) {
      const p2pMessage =
        parsedMessage.p2p as P2PArbitrageWebSocketIncomingMessage;

      p2pArbitrageConfig.set(
        `${p2pMessage.exchangeSlug}_${p2pMessage.asset}-${p2pMessage.fiat}`,
        {
          minProfit: p2pMessage.minProfit ?? 1,
          volume: p2pMessage.volume ?? 1,
          userType: Object.hasOwn(p2pMessage, 'userType')
            ? p2pMessage.userType
            : P2PUserType.merchant,
          sellLimits: Object.hasOwn(p2pMessage, 'sellLimits')
            ? p2pMessage.sellLimits
            : [100000, 100000],
          buyLimits: Object.hasOwn(p2pMessage, 'buyLimits')
            ? p2pMessage.buyLimits
            : [100, 100000],
          nickName: p2pMessage.nickName,
          maxBuyOrderPosition: p2pMessage.maxBuyOrderPosition ?? 500,
          maxSellOrderPosition: p2pMessage.maxSellOrderPosition ?? 500,
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

async function makeJSONP2PMessage(
  exchangeSlug: string,
  pair: IPair,
  config: P2PArbitrageWebSocketConfig,
  arbitrageCalculator: ArbitrageCalculator
): Promise<string> {
  const orders = await exchangeService.getP2POrders(exchangeSlug, pair);

  const computedArbitrage: P2PArbitrageResult =
    arbitrageCalculator.calculateP2PArbitrage({
      buyOrders: orders.buyOrders,
      sellOrders: orders.sellOrders,
      volume: config.volume,
      minProfit: config.minProfit,
      userType: config.userType,
      sellLimits: config.sellLimits,
      buyLimits: config.buyLimits,
      nickName: config.nickName,
      maxBuyOrderPosition: config.maxBuyOrderPosition,
      maxSellOrderPosition: config.maxSellOrderPosition,
    });

  const message: P2POutgoingMessage = {
    p2p: {
      exchangeSlug: exchangeSlug,
      crypto: pair.crypto,
      fiat: pair.fiat,
      totalBuyOrders: orders.buyOrders.length,
      totalSellOrders: orders.sellOrders.length,
      buyOrders: computedArbitrage.buyOrders,
      sellOrders: computedArbitrage.sellOrders,
      arbitrage: computedArbitrage.arbitrage,
    },
  };

  console.log(message.p2p.exchangeSlug, message.p2p.arbitrage?.profit);

  return JSON.stringify(message);
}

async function makeJSONCryptoMessage(
  asset: string,
  fiat: string,
  volume: number,
  fees?: ExchangesFeesType | null
) {
  const rawPrices: IExchangePricingDTO[] =
    await exchangeService.getAllExchangesPricesBySymbol(asset, fiat, volume);

  const totalPrices: IExchangePricingTotalDTO[] = rawPrices.map((price) => {
    const exchangeFees = fees
      ? fees[price.exchangeSlug.replaceAll(' ', '').toLocaleLowerCase()]
      : undefined;

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

    return { ...price, totalAsk: price.ask, totalBid: price.bid };
  });

  return JSON.stringify({
    asset: asset,
    fiat: fiat,
    prices: totalPrices,
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
