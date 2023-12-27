import { RestClientV2 } from 'bitget-api'
import { IPairPricing } from '../../../types/exchange.js'

const API_KEY = process.env.BITGET_API_KEY
const API_SECRET = process.env.BITGET_API_SECRET
const API_PASS = process.env.BITGET_API_PASS

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
