import { IPair } from '../data/model/exchange_base.model.js';
import { IP2POrder, IP2PPairOrders } from '../data/model/exchange_p2p.model.js';
import { IExchangePricingRepository } from './exchange-base-repository.js';

export interface IExchangeP2PRepository extends IExchangePricingRepository {
  getP2POrders(exchangeSlug: string, pair: IPair): Promise<IP2PPairOrders>;

  updateP2POrders(
    exchangeSlug: string,
    baseAsset: string,
    fiat: string,
    sellOrders: IP2POrder[],
    buyOrders: IP2POrder[]
  ): Promise<void>;
}
