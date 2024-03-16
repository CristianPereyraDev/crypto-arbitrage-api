// import { RestClientV2 } from 'bitget-api'
// import { ExchangeCollectorReturnType } from '../index.js'

// const API_KEY = process.env.BITGET_API_KEY
// const API_SECRET = process.env.BITGET_API_SECRET
// const API_PASS = process.env.BITGET_API_PASS

// const client = new RestClientV2({
//   apiKey: API_KEY,
//   apiSecret: API_SECRET,
//   apiPass: API_PASS
// })

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// const url = 'https://api.bitget.com/api/v2/p2p/merchantList?online=yes&limit=20'

// export async function getBitgetPairPrices(
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   asset: string,
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   fiat: string
// ): Promise<ExchangeCollectorReturnType | undefined> {
//   try {
//     const endTime = Date.now()
//     const startTime = endTime - 1000 * 60 * 60 * 2
//     console.log('startTime=', endTime - startTime)
//     const p2pMerchantList = await client.getP2PMerchantAdvertisementList({
//       //limit: '20',
//       startTime: startTime.toFixed(0),
//       endTime: endTime.toFixed(0),
//       coin: 'USDT',
//       fiat: 'ARS',
//       side: 'buy'
//       //status: 'online'
//       //language: 'en-US'
//     })
//     //const p2pMerchantList = await client.getP2PMerchantList({})

//     console.log(p2pMerchantList.data)

//     return undefined
//   } catch (error) {
//     console.error(error)
//     return undefined
//   }
// }
