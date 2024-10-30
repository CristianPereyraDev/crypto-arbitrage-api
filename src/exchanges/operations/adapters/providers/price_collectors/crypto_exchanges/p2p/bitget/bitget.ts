import { RestClientV2 } from 'bitget-api';
import {
  IP2POrder,
  P2POrderType,
  P2PUserType,
} from '../../../../../../../../data/model/exchange_p2p.model.js';
import { performDynamicScraping } from './scraping/index.js';

const API_KEY =
  process.env.BITGET_API_KEY || 'bg_5ff6e1850bf463930a0be7515efa0629';
const API_SECRET =
  process.env.BITGET_API_SECRET ||
  '36e991da0b7ec1fbb68aa31f15d7de2df471684e6ea9b4c64b201dfc0c6ba234';

const client = new RestClientV2({
  apiKey: API_KEY,
  apiSecret: API_SECRET,
  apiPass: 'Perico245781',
});

export async function getBitgetP2POrders(
  asset: string,
  fiat: string,
  tradeType: P2POrderType,
  publisherType: P2PUserType | null
): Promise<IP2POrder[]> {
  const result = await performDynamicScraping(
    asset,
    fiat,
    tradeType,
    publisherType
  );
  return result;
}
