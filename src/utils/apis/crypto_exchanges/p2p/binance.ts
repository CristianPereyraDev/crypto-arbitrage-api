import {
  IP2POrder,
  P2POrderType
} from 'src/databases/mongodb/model/exchange.model.js'

export type BinanceP2PTradeMethodType = {
  payId: string | null
  payMethodId: string
  payType: string | null
  payAccount: string | null
  payBank: string | null
  paySubBank: string | null
  identifier: string
  iconUrlColor: string | null
  tradeMethodName: string | null
  tradeMethodShortName: string | null
  tradeMethodBgColor: string
}

export type BinanceP2POrderType = {
  adv: {
    advNo: string
    price: string
    maxSingleTransAmount: string
    minSingleTransAmount: string
    tradableQuantity: string
    tradeMethods: BinanceP2PTradeMethodType[]
  }
  advertiser: {
    userNo: string
    nickName: string
    proMerchant: string
    userType: 'merchant' | 'user' | null
    monthOrderCount: number
    monthFinishRate: number
    positiveRate: number
  }
}

export async function getP2POrders (
  asset: string,
  fiat: string,
  tradeType: P2POrderType
): Promise<IP2POrder[] | undefined> {
  const data = {
    fiat: fiat,
    page: 1,
    rows: 20,
    tradeType: tradeType,
    asset: asset,
    countries: [],
    proMerchantAds: false,
    shieldMerchantAds: false,
    publisherType: null,
    payTypes: [],
    classifies: ['mass', 'profession']
  }
  try {
    const response = await fetch(
      `https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )

    if (response.ok) {
      const jsonResponse: any = await response.json()
      const formatedResponse = jsonResponse.data.map(
        (order: BinanceP2POrderType) => {
          return {
            orderType: tradeType,
            orderId: order.adv.advNo,
            volume: parseFloat(order.adv.tradableQuantity),
            price: parseFloat(order.adv.price),
            min: parseFloat(order.adv.minSingleTransAmount),
            max: parseFloat(order.adv.maxSingleTransAmount),
            payments: order.adv.tradeMethods.map(tradeMethod => {
              return {
                slug: tradeMethod.identifier,
                name: tradeMethod.tradeMethodName
              }
            }),

            merchantId: order.advertiser.userNo,
            merchantName: order.advertiser.nickName,
            monthOrderCount: order.advertiser.monthOrderCount,
            monthFinishRate: order.advertiser.monthFinishRate,
            positiveRate: order.advertiser.positiveRate,
            link: ''
          }
        }
      ) as IP2POrder[]

      return formatedResponse
    } else {
      console.log('Status code=', response.status)
      return undefined
    }
  } catch (error) {
    console.log('Error on fetch to p2p: %s', error)
    return undefined
  }
}
