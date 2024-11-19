import NodeCache from 'node-cache';

import { IExchangePairPrices } from '../../../data/model/exchange.model.js';
import {
  ExchangeType,
  IPair,
} from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import { IExchangeRepository } from '../../exchange-repository.js';
import { calculateOrderBookAvgPrice } from '../../../exchanges/operations/exchange-utils.js';

type ExchangeSchema = {
  asks: string[];
  bids: string[];
};

export default class ExchangeRepositoryNodeCache
  implements IExchangeRepository
{
  nodeCache: NodeCache;

  constructor(nodeCache: NodeCache) {
    this.nodeCache = nodeCache;
  }

  async updatePrices(
    exchangeSlugName: string,
    prices: IExchangePairPrices[]
  ): Promise<void> {
    try {
      prices.map((price) =>
        this.nodeCache.set<ExchangeSchema>(
          `${ExchangeType.Exchange}_${exchangeSlugName}_${price.crypto}-${price.fiat}`,
          {
            asks: price.asksAndBids.asks.map((askEntry) =>
              JSON.stringify(askEntry.map((v) => v.toString()))
            ),
            bids: price.asksAndBids.bids.map((bidEntry) =>
              JSON.stringify(bidEntry.map((v) => v.toString()))
            ),
          }
        )
      );
    } catch (error) {
      console.error('An error in updateExchangePrices has occurred: %s', error);
    }
  }

  async getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]> {
    try {
      const exchangesKeys = this.nodeCache.keys().filter((key) => {
        const keySplitted = key.split('_');

        return (
          keySplitted[0] === ExchangeType.Exchange &&
          keySplitted[2] === `${pair.crypto}-${pair.fiat}`
        );
      });

      const prices = exchangesKeys.map((exchangeKey) => {
        const keySplitted = exchangeKey.split('_');
        const exchange = this.nodeCache.get<ExchangeSchema>(
          exchangeKey
        ) as ExchangeSchema;

        const askOrders = exchange.asks.map((ask) =>
          (JSON.parse(ask) as string[]).map((v) => Number(v))
        );
        const avgAsk = calculateOrderBookAvgPrice(askOrders, volume);

        const bidOrders = exchange.bids.map((bid) =>
          (JSON.parse(bid) as string[]).map((v) => Number(v))
        );
        const avgBid = calculateOrderBookAvgPrice(bidOrders, volume);

        return {
          exchangeSlug: keySplitted[1],
          pair,
          exchangeType: ExchangeType.Exchange,
          ask: avgAsk,
          bid: avgBid,
          time: 1,
        } satisfies IExchangePricingDTO;
      });

      return prices;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
