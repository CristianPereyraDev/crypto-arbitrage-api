import { IPair } from '../databases/model/exchange_base.model.js'
import {
  IP2PExchange,
  IP2POrder,
  P2POrderType
} from '../databases/model/exchange_p2p.model.js'
import { ExchangeBaseRepository } from './exchange-base-repository.js'

export interface IExchangeP2PRepository
  extends ExchangeBaseRepository<IP2PExchange> {
  getP2POrders(exchangeName: string, pair: IPair): Promise<IP2POrder[]>
  updateP2POrders(
    exchangeName: string,
    baseAsset: string,
    fiat: string,
    orderType: P2POrderType,
    orders: IP2POrder[]
  ): Promise<void>
}
