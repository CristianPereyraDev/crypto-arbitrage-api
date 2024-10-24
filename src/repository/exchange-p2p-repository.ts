import { IPair } from '../data/model/exchange_base.model.js';
import {
  IP2PExchange,
  IP2POrder,
  IP2PPairOrders,
  P2POrderType,
} from '../data/model/exchange_p2p.model.js';
import {
  ExchangeBaseRepository,
  IPriceableRepository,
} from './exchange-base-repository.js';

export interface IExchangeP2PRepository
  extends ExchangeBaseRepository<IP2PExchange>,
    IPriceableRepository {
  getP2POrders(
    exchangeName: string,
    pair: IPair
  ): Promise<IP2PPairOrders | null>;
  updateP2POrders(
    exchangeSlugName: string,
    baseAsset: string,
    fiat: string,
    orderType: P2POrderType,
    orders: IP2POrder[]
  ): Promise<void>;
}
