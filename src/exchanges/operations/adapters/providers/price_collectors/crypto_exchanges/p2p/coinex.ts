import { fetchWithTimeout } from '../../../../../../../utils/network.utils.js';
import {
  IP2POrder,
  IPaymentMethod,
  P2POrderType,
  P2PUserType,
} from '../../../../../../../data/model/exchange_p2p.model.js';
import { APIError } from '../../../../../../../data/errors/index.js';

type CoinexP2POrder = {
  merchant: {
    nickname: string;
    name_word: string;
    id: string;
    deal_count: number;
    completion_rate: number;
    acceptance_rate: number;
    avg_payment_time: number;
    avg_release_time: number;
  };
  user_preferences: {
    is_traded: boolean;
    limiter_msgs: [];
    is_allowed: boolean;
  };
  adv_type: string;
  id: string;
  adv_number: string;
  base: string;
  quote: string;
  price: string;
  stocks_quantity: string;
  min_limit?: string;
  max_limit: string;
  pay_channel_ids: string[];
};

type CoinexP2PResponse = {
  code: number;
  data: {
    items: CoinexP2POrder[] | null;
    total: number;
  };
  message: string;
  requestTime: string;
};

type CoinexP2PPostConfig = {
  adv_type: string;
  base: string;
  quote: string;
  amount: number;
  pay_channel_ids: string[];
  sort_by: string;
  sort_type: string;
  user_preferences: string[];
  page: number;
  limit: number;
};

type CoinExP2PConfigResponse = {
  code: number;
  data: { country_pay_channels: { id: string; name: string }[] };
  message: string;
};

async function fetchCoinExConfigObj(): Promise<CoinExP2PConfigResponse> {
  const endpoint = 'https://www.coinex.com/res/p2p/config';
  try {
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      if (response.status === 404) throw new Error('404, Not found');
      if (response.status === 500)
        throw new Error('500, internal server error');

      throw new Error(`${response.status} ${response.statusText}`);
    }

    const jsonResponse = (await response.json()) as CoinExP2PConfigResponse;

    if (jsonResponse.code > 0) {
      throw new APIError(endpoint, 'CoinEx P2P API', jsonResponse.message);
    }

    return jsonResponse;
  } catch (error) {
    throw new Error(`Error on fetchP2POrders: ${error}`);
  }
}

function mapPaymentInfo(
  configObj: CoinExP2PConfigResponse,
  payChannelIds: string[]
): IPaymentMethod[] {
  return payChannelIds.map((payId) => {
    const channel = configObj.data.country_pay_channels.find(
      (channel) => channel.id === payId
    );
    return { name: channel?.name || payId, slug: channel?.name || payId };
  });
}

async function fetchP2POrders(
  config: CoinexP2PPostConfig
): Promise<CoinexP2PResponse> {
  const endpoint = 'https://www.coinex.com/res/p2p/advertising';
  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error('404, Not found');
      if (response.status === 500)
        throw new Error('500, internal server error');

      throw new Error(`${response.status} ${response.statusText}`);
    }

    const jsonResponse = (await response.json()) as CoinexP2PResponse;

    if (jsonResponse.code > 0) {
      throw new APIError(endpoint, 'CoinEx P2P API', jsonResponse.message);
    }

    return jsonResponse;
  } catch (error) {
    throw new Error(`Error on fetchP2POrders: ${error}`);
  }
}

function mapP2PResponse(
  configObj: CoinExP2PConfigResponse,
  apiResponse: CoinexP2PResponse
): IP2POrder[] {
  if (apiResponse.data.items === null) {
    return [];
  }

  const mappedResponse = apiResponse.data.items.map((order: CoinexP2POrder) => {
    return {
      orderId: order.id,
      volume: parseFloat(order.stocks_quantity),
      price: parseFloat(order.price),
      min: parseFloat(order.min_limit || '0'),
      max: parseFloat(order.max_limit),
      payments: mapPaymentInfo(configObj, order.pay_channel_ids),
      merchantName: order.merchant.nickname,
      positiveRate: order.merchant.acceptance_rate,
      userType: P2PUserType.merchant,
      merchantId: order.merchant.id,
      monthOrderCount: 1,
      monthFinishRate: 1,
      link: '',
      orderType:
        order.adv_type === 'BUY' ? P2POrderType.BUY : P2POrderType.SELL,
    } satisfies IP2POrder;
  }) as IP2POrder[];

  return mappedResponse;
}

export async function getP2POrders(
  asset: string,
  fiat: string,
  publisherType: P2PUserType | null
): Promise<{ buy: IP2POrder[]; sell: IP2POrder[] }> {
  const configObj = await fetchCoinExConfigObj();
  const fetchConfig: CoinexP2PPostConfig = {
    adv_type: 'BUY', // side=BUY => retrieve sell orders
    base: asset,
    quote: fiat,
    amount: 0,
    pay_channel_ids: [], // Empty array means all payment methods
    sort_by: 'PRICE',
    sort_type: 'ASC',
    user_preferences: [],
    page: 1,
    limit: 20,
  };

  try {
    const buyOrders = await fetchP2POrders({
      ...fetchConfig,
      adv_type: 'SELL',
      sort_type: 'DESC',
    });
    const sellOrders = await fetchP2POrders({
      ...fetchConfig,
      adv_type: 'BUY',
      sort_type: 'ASC',
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
    return {
      buy: mapP2PResponse(configObj, buyOrders),
      sell: mapP2PResponse(configObj, sellOrders),
    };
  } catch (error) {
    throw new Error(
      `coinex.getP2POrders error for pair ${asset}-${fiat}, ${error}`
    );
  }
}
