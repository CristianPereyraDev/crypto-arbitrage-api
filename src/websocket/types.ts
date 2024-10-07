import { IP2POrder, P2PUserType } from '../data/model/exchange_p2p.model.js';
import { P2PArbitrage } from '../utils/arbitrages/p2p_strategies/types.js';

export type CryptoPairWebSocketConfig = {
  volume: number;
};

export type CryptoP2PWebSocketConfig = {
  minProfit: number;
  volume: number;
  sellLimits: [number, number];
  buyLimits: [number, number];
  userType: P2PUserType;
  nickName: string;
  maxBuyOrderPosition: number;
  maxSellOrderPosition: number;
};

export type P2POutgoingMessage = {
  p2p: {
    exchange: string;
    crypto: string;
    fiat: string;
    buyOrders: IP2POrder[];
    totalBuyOrders: number;
    sellOrders: IP2POrder[];
    totalSellOrders: number;
    arbitrage: P2PArbitrage | null;
  };
};
