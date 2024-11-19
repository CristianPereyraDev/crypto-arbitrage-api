import NodeCache from 'node-cache';

import { IBrokeragePairPrices } from '../../../data/model/brokerage.model.js';
import {
  ExchangeType,
  IPair,
} from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import { IBrokerageRepository } from '../../brokerage-repository.js';

type BrokerageSchema = {
  ask: string;
  bid: string;
};

export default class BrokerageRepositoryNodeCache
  implements IBrokerageRepository
{
  nodeCache: NodeCache;

  constructor(nodeCache: NodeCache) {
    this.nodeCache = nodeCache;
  }

  async updatePrices(
    exchangeSlugName: string,
    prices: IBrokeragePairPrices[]
  ): Promise<void> {
    try {
      prices.map((price) =>
        this.nodeCache.set<BrokerageSchema>(
          `${ExchangeType.Brokerage}_${exchangeSlugName}_${price.crypto}-${price.fiat}`,
          {
            ask: price.ask.toString(),
            bid: price.bid.toString(),
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
      const brokerageKeys = this.nodeCache.keys().filter((key) => {
        const keySplitted = key.split('_');

        return (
          keySplitted[0] === ExchangeType.Brokerage &&
          keySplitted[2] === `${pair.crypto}-${pair.fiat}`
        );
      });

      const prices = brokerageKeys.map((brokerageKey) => {
        const brokerage = this.nodeCache.get<BrokerageSchema>(
          brokerageKey
        ) as BrokerageSchema;
        const keySplitted = brokerageKey.split('_');

        return {
          exchangeSlug: keySplitted[1],
          pair,
          exchangeType: ExchangeType.Brokerage,
          ask: Number(brokerage.ask),
          bid: Number(brokerage.bid),
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
