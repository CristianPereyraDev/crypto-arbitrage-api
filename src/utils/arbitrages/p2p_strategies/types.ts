import {
	IP2POrder,
	P2PUserType,
} from "../../../databases/model/exchange_p2p.model.js";

export type P2PArbitrage = {
	profit: number;
	suggestedBuyOrder: IP2POrder;
	suggestedSellOrder: IP2POrder;
};

export type CalculateP2PArbitrageParams = {
	buyOrders: IP2POrder[];
	sellOrders: IP2POrder[];
	volume: number;
	minProfit: number;
	userType: P2PUserType;
	sellLimits: [number, number];
	buyLimits: [number, number];
};

export type CalculateP2PArbitrageResult = {
	arbitrage: P2PArbitrage | null;
	sellOrders: IP2POrder[];
	buyOrders: IP2POrder[];
};

export interface IP2PArbitrageStrategy {
	calculateP2PArbitrage: (
		params: CalculateP2PArbitrageParams,
	) => CalculateP2PArbitrageResult;
}
