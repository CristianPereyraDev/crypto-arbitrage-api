import { fetchWithTimeout } from '../../../../../../../../utils/network.utils.js';
import {
  IP2POrder,
  P2POrderType,
  P2PUserType,
} from '../../../../../../../../data/model/exchange_p2p.model.js';

export type BitgetP2PPaymentMethodInfo = {
  iconUrl: string;
  isModifyKyc: 0;
  paymethodId: string;
  paymethodInfo: [
    {
      name: string;
      required: number;
      type: string;
    }
  ];
  paymethodName: string;
  paymethodNameHandle: boolean;
};

export type BitgetP2POrder = {
  adNo: string;
  nickName: string;
  price: string;
  lastAmount: string;
  minAmount: string;
  maxAmount: string;
  paymethodInfo: BitgetP2PPaymentMethodInfo[];
  goodEvaluationRate: string;
  turnoverRateNum: number;
  encryptUserId: string;
  certifiedMerchant: number;
  adType: number;
};

export type BitgetP2PResponse = {
  code: string;
  data: {
    dataList: BitgetP2POrder[] | null;
    totalCount: number;
  };
  msg: string | null;
  requestTime: string;
};

export type BitgetP2PPostConfig = {
  side: number;
  pageNo: number;
  pageSize: number;
  coinCode: string;
  fiatCode: string;
  languageType: number;
};

async function fetchP2POrders(
  config: BitgetP2PPostConfig
): Promise<BitgetP2PResponse> {
  try {
    const response = await fetchWithTimeout(
      'https://www.bitget.com/v1/p2p/pub/adv/queryAdvList',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }
    );

    if (!response.ok) {
      if (response.status === 404) throw new Error('404, Not found');
      if (response.status === 500)
        throw new Error('500, internal server error');

      throw new Error(`${response.status} ${response.statusText}`);
    }

    const jsonResponse = (await response.json()) as BitgetP2PResponse;

    return jsonResponse;
  } catch (error) {
    throw new Error(`Error on fetchP2POrders: ${error}`);
  }
}

function mapP2PResponse(apiResponse: BitgetP2PResponse): IP2POrder[] {
  if (apiResponse.data.dataList === null) {
    return [];
  }

  const mappedResponse = apiResponse.data.dataList.map(
    (order: BitgetP2POrder) => {
      return {
        orderId: order.adNo,
        volume: parseFloat(order.lastAmount),
        price: parseFloat(order.price),
        min: parseFloat(order.minAmount),
        max: parseFloat(order.maxAmount),
        payments: order.paymethodInfo.map((tradeMethod) => {
          return {
            slug: tradeMethod.paymethodId,
            name: tradeMethod.paymethodName,
          };
        }),
        merchantName: order.nickName,
        positiveRate: order.turnoverRateNum,
        userType:
          order.certifiedMerchant === 1
            ? P2PUserType.merchant
            : P2PUserType.user,
        merchantId: order.encryptUserId,
        monthOrderCount: 1,
        monthFinishRate: 1,
        link: '',
        orderType: order.adType === 1 ? P2POrderType.BUY : P2POrderType.SELL,
      } satisfies IP2POrder;
    }
  ) as IP2POrder[];

  return mappedResponse;
}

export async function getP2POrders(
  asset: string,
  fiat: string,
  publisherType: P2PUserType | null
): Promise<{ buy: IP2POrder[]; sell: IP2POrder[] }> {
  const fetchConfig: BitgetP2PPostConfig = {
    coinCode: asset,
    fiatCode: fiat,
    pageNo: 1,
    pageSize: 20,
    side: 1, // side=1 => retrieve sell orders
    languageType: 7,
  };

  try {
    const buyOrders = await fetchP2POrders({
      ...fetchConfig,
      side: 2,
    });
    const sellOrders = await fetchP2POrders({
      ...fetchConfig,
      side: 1,
    });

    // const pages = Math.min(
    //   Math.ceil(buyOrders.data.totalCount / fetchConfig.pageSize),
    //   Number(process.env.BITGET_P2P_MAX_CONCURRENT_API_CALLS || '1')
    // );

    // const results = await Promise.all(
    //   [...Array(pages).keys()].map((page) =>
    //     fetchP2POrders({ ...fetchConfig, pageNo: page + 1 })
    //   )
    // );

    //return results.flatMap((apiResponse) => mapP2PResponse(apiResponse));
    return { buy: mapP2PResponse(buyOrders), sell: mapP2PResponse(sellOrders) };
  } catch (error) {
    throw new Error(
      `bitget.getP2POrders error for pair ${asset}-${fiat}, ${error}`
    );
  }
}
