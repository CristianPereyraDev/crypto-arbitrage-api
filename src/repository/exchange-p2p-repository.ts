import { IPair } from '../data/model/exchange_base.model.js';
import {
  IP2POrder,
  IP2PPairOrders,
  P2POrderType,
} from '../data/model/exchange_p2p.model.js';
import { IExchangePricingRepository } from './exchange-base-repository.js';

export interface IExchangeP2PRepository extends IExchangePricingRepository {
  getP2POrders(
    exchangeName: string,
    pair: IPair
  ): Promise<IP2PPairOrders | null>;

  updateP2POrders(
    exchangeSlugName: string,
    baseAsset: string,
    fiat: string,
    sellOrders: IP2POrder[],
    buyOrders: IP2POrder[]
  ): Promise<void>;
}
