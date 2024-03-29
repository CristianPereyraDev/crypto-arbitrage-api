import {
	IP2POrder,
	P2PUserType,
} from "../databases/model/exchange_p2p.model.js";
import { P2PArbitrage } from "../utils/arbitrages/p2p_strategies/types.js";

export type CryptoPairWebSocketConfig = {
	volume: number;
};

export type CryptoP2PWebSocketConfig = {
	minProfit: number;
	volume: number;
	sellLimits: [number, number];
	buyLimits: [number, number];
	userType: P2PUserType;
};

export type P2POutgoingMessage = {
	p2p: {
		exchange: string;
		crypto: string;
		fiat: string;
		buyOrders: IP2POrder[];
		sellOrders: IP2POrder[];
		arbitrage: P2PArbitrage | null;
	};
};
