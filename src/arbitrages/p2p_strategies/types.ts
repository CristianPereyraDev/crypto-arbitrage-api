import {
  IP2POrder,
  P2PUserType,
} from '../../../data/model/exchange_p2p.model.js';

export type P2PArbitrage = {
  profit: number;
  suggestedBuyOrder: IP2POrder | null;
  suggestedSellOrder: IP2POrder | null;
  buyOrderPosition: number;
  sellOrderPosition: number;
};

export type CalculateP2PArbitrageParams = {
  buyOrders: IP2POrder[];
  sellOrders: IP2POrder[];
  volume: number;
  minProfit: number;
  userType: P2PUserType;
  sellLimits: [number, number];
  buyLimits: [number, number];
  nickName?: string;
  maxSellOrderPosition?: number;
  maxBuyOrderPosition?: number;
};

export type P2PArbitrageResult = {
  arbitrage: P2PArbitrage | null;
  sellOrders: IP2POrder[];
  buyOrders: IP2POrder[];
};

export interface IP2PArbitrageStrategy {
  calculateP2PArbitrage: (
    params: CalculateP2PArbitrageParams
  ) => P2PArbitrageResult;
}
