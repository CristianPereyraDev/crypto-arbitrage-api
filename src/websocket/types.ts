import { IP2POrder, P2PUserType } from '../data/model/exchange_p2p.model.js';
import { P2PArbitrage } from '../arbitrages/p2p_strategies/types.js';

export type CrossArbitrageWebSocketConfig = {
  volume: number;
  includeFees?: boolean;
};

export type P2PArbitrageWebSocketConfig = {
  minProfit: number;
  volume: number;
  sellLimits: [number, number];
  buyLimits: [number, number];
  userType: P2PUserType;
  nickName: string;
  maxBuyOrderPosition: number;
  maxSellOrderPosition: number;
};

export type P2PArbitrageWebSocketIncomingMessage =
  P2PArbitrageWebSocketConfig & {
    exchangeSlug: string;
    asset: string;
    fiat: string;
  };

export type P2POutgoingMessage = {
  p2p: {
    exchangeSlug: string;
    crypto: string;
    fiat: string;
    buyOrders: IP2POrder[];
    totalBuyOrders: number;
    sellOrders: IP2POrder[];
    totalSellOrders: number;
    arbitrage: P2PArbitrage | null;
  };
};
