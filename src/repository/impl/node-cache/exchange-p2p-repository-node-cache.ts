import NodeCache from 'node-cache';

import {
  ExchangeType,
  IPair,
} from '../../../data/model/exchange_base.model.js';
import { IExchangePricingDTO } from '../../../data/dto/index.js';
import {
  IP2POrder,
  IP2PPairOrders,
} from '../../../data/model/exchange_p2p.model.js';
import { IExchangeP2PRepository } from '../../exchange-p2p-repository.js';
import { calculateOrderBookAvgPrice } from '../../../exchanges/operations/exchange-utils.js';

type ExchangeP2PSchema = {
  sellOrders: string[];
  buyOrders: string[];
};

export class ExchangeP2PRepositoryNodeCache implements IExchangeP2PRepository {
  nodeCache: NodeCache;

  constructor(nodeCache: NodeCache) {
    this.nodeCache = nodeCache;
  }

  async updateP2POrders(
    exchangeSlug: string,
    baseAsset: string,
    fiat: string,
    sellOrders: IP2POrder[],
    buyOrders: IP2POrder[]
  ): Promise<void> {
    this.nodeCache.set<ExchangeP2PSchema>(
      `${ExchangeType.P2PExchange}_${exchangeSlug}_${baseAsset}-${fiat}`,
      {
        sellOrders: sellOrders.map((order) => JSON.stringify(order)),
        buyOrders: buyOrders.map((order) => JSON.stringify(order)),
      }
    );
  }

  async getP2POrders(
    exchangeSlug: string,
    pair: IPair
  ): Promise<IP2PPairOrders> {
    const p2pExchange = this.nodeCache.get<ExchangeP2PSchema>(
      `${ExchangeType.P2PExchange}_${exchangeSlug}_${pair.crypto}-${pair.fiat}`
    );

    if (
      p2pExchange !== undefined &&
      p2pExchange.buyOrders !== undefined &&
      p2pExchange.sellOrders !== undefined
    ) {
      return {
        ...pair,
        buyOrders: (p2pExchange.buyOrders as string[]).map((strOrder) =>
          JSON.parse(strOrder)
        ),
        sellOrders: (p2pExchange.sellOrders as string[]).map((strOrder) =>
          JSON.parse(strOrder)
        ),
      };
    }

    return { ...pair, buyOrders: [], sellOrders: [] };
  }

  async getAllPricesByPair(
    pair: IPair,
    volume: number
  ): Promise<IExchangePricingDTO[]> {
    try {
      const p2pKeys = this.nodeCache.keys().filter((key) => {
        const keySplitted = key.split('_');

        return (
          keySplitted[0] === ExchangeType.P2PExchange &&
          keySplitted[2] === `${pair.crypto}-${pair.fiat}`
        );
      });

      const prices: IExchangePricingDTO[] = p2pKeys.map((p2pKey) => {
        const keySplitted = p2pKey.split('_');
        const p2pExchange = this.nodeCache.get<ExchangeP2PSchema>(
          p2pKey
        ) as ExchangeP2PSchema;

        const buyOrders: IP2POrder[] = p2pExchange.buyOrders.map((strOrder) =>
          JSON.parse(strOrder)
        );
        const avgBid = calculateOrderBookAvgPrice(
          buyOrders.map((p2pOrder) => [p2pOrder.price, p2pOrder.volume]),
          volume
        );

        const sellOrders: IP2POrder[] = p2pExchange.sellOrders.map((strOrder) =>
          JSON.parse(strOrder)
        );
        const avgAsk = calculateOrderBookAvgPrice(
          sellOrders.map((p2pOrder) => [p2pOrder.price, p2pOrder.volume]),
          volume
        );

        return {
          exchangeSlug: keySplitted[1],
          pair,
          exchangeType: ExchangeType.P2PExchange,
          ask: avgAsk,
          bid: avgBid,
          time: 0,
        } satisfies IExchangePricingDTO;
      });

      return prices;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
