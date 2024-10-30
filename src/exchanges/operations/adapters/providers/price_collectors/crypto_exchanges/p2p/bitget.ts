import { RestClientV2 } from 'bitget-api';
import {
  IP2POrder,
  P2POrderType,
  P2PUserType,
} from '../../../../../../../data/model/exchange_p2p.model.js';

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

export async function getBitgetPairPrices(
  asset: string,
  fiat: string,
  tradeType: P2POrderType,
  publisherType: P2PUserType | null
): Promise<IP2POrder[]> {
  try {
    const endTime = Date.now();
    const startTime = endTime - 1000 * 60 * 60 * 48;
    console.log('startTime=', new Date(startTime).toLocaleString());
    const p2pMerchantList = await client.getP2PMerchantList({
      //limit: '20',
      startTime: startTime.toFixed(0),
      //endTime: endTime.toFixed(0),
      coin: 'USDT',
      fiat: 'ARS',
      side: 'buy',
      status: 'online',
      language: 'en-US',
      sourceType: 'competitor',
    });
    //const p2pMerchantList = await client.getP2PMerchantList({})

    console.log(p2pMerchantList.data);

    return [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
