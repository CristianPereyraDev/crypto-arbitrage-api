import * as binance from './binance.js';
import * as binancep2p from './p2p/binance.js';
import * as bitmonedero from './bitmonedero.js';
import * as cryptomarket from './cryptomarket.js';
import * as ripiotrade from './ripiotrade.js';
import * as saldo from './saldo.js';
import * as trubit from './trubit.js';
import * as bitso from './bitso.js';
import * as pluscrypto from './pluscrypto.js';
import * as fiwind from './fiwind.js';
import * as tiendacrypto from './tiendacrypto.js';
import * as satoshitango from './satoshitango.js';
import * as cryptoya from './cryptoya.js';
import * as bitgetP2P from './p2p/bitget/bitget.js';

import {
  IP2POrder,
  P2POrderType,
  P2PUserType,
} from '../../../../../../data/model/exchange_p2p.model.js';
import { IExchangePairPrices } from '../../../../../../data/model/exchange.model.js';
import { IBrokeragePairPrices } from '../../../../../../data/model/brokerage.model.js';
import { IPair } from '../../../../../../data/model/exchange_base.model.js';

const exchangePriceCollectors = new Map<
  string,
  (pairs: IPair[]) => Promise<IExchangePairPrices[]>
>();

const brokeragePriceCollectors = new Map<
  string,
  (pairs: IPair[]) => Promise<IBrokeragePairPrices[]>
>();

// Multi brokerage collector
const brokeragePriceCollectorMulti: (
  brokerages: string[],
  pairs: IPair[]
) => Promise<Map<string, IBrokeragePairPrices[]>> =
  cryptoya.getAllBrokeragePricesByPair;

// Exchange collectors
exchangePriceCollectors.set('binance', binance.getSpotAskBidPrices);
exchangePriceCollectors.set('cryptomarket', cryptomarket.getPairPrices);
exchangePriceCollectors.set('ripiotrade', ripiotrade.getPairPrices);
exchangePriceCollectors.set('trubit', trubit.getPairPrices);
exchangePriceCollectors.set('bitso', bitso.getPairPrices);

// Brokerage collectors
brokeragePriceCollectors.set('fiwind', fiwind.getPairPrices);
brokeragePriceCollectors.set('pluscrypto', pluscrypto.getPairPrices);
brokeragePriceCollectors.set('satoshitango', satoshitango.getPairPrices);
brokeragePriceCollectors.set('saldo', saldo.getPairPrices);
brokeragePriceCollectors.set('tiendacrypto', tiendacrypto.getPairPrices);

// P2P Exchange collectors
export type P2PCollectorFunctionType = (
  asset: string,
  fiat: string,
  publisherType: P2PUserType | null
) => Promise<{ buy: IP2POrder[]; sell: IP2POrder[] }>;

const p2pOrderCollectors = new Map<string, P2PCollectorFunctionType>();

p2pOrderCollectors.set('binancep2p', binancep2p.getP2POrders);
p2pOrderCollectors.set('bitgetp2p', bitgetP2P.getP2POrders);

export {
  exchangePriceCollectors,
  brokeragePriceCollectors,
  brokeragePriceCollectorMulti,
  p2pOrderCollectors,
};
