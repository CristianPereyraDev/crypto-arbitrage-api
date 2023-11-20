import { RestClientV2 } from 'bitget-api'
import { createHmac } from 'crypto'
import { IPairPricing } from 'types/exchange.js'

const API_KEY = 'bg_5ff6e1850bf463930a0be7515efa0629'
const API_SECRET =
  '36e991da0b7ec1fbb68aa31f15d7de2df471684e6ea9b4c64b201dfc0c6ba234'
const API_PASS = 'Perico245781'

const client = new RestClientV2({
  apiKey: API_KEY,
  apiSecret: API_SECRET,
  apiPass: API_PASS
})

let url = 'https://api.bitget.com/api/v2/p2p/merchantList?online=yes&limit=20'

export async function getBitgetPairPrices (
  asset: string,
  fiat: string
): Promise<IPairPricing> {
  try {
    const startTime = Date.now() - 1000 * 60 * 60 * 2
    console.log('startTime=', startTime)
    const endTime = startTime + 1000 * 60 * 1
    const p2pMerchantList = await client.getP2PMerchantAdvertisementList({
      //limit: '20',
      startTime: startTime.toFixed(0),
      endTime: Date.now().toFixed(0),
      coin: 'BTC',
      fiat: 'USD',
      status: 'online'
      //language: 'en-US'
    })
    //const p2pMerchantList = await client.getP2PMerchantList({})

    console.log(p2pMerchantList.data.merchantList)

    return { asks: [], bids: [] }
  } catch (error) {
    console.log(error)
    return { asks: [], bids: [] }
  }
}
