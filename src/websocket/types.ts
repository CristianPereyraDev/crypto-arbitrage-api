import { IPair } from "../databases/model/exchange_base.model.js";
import { IP2POrder } from "../databases/model/exchange_p2p.model.js";
import { P2PArbitrage } from "../utils/arbitrages/arbitrage-calculator.js";

export type CryptoPairWebSocketConfig = {
	volume: number;
};

export type CryptoP2PWebSocketConfig = {
	pairs: IPair[];
	minProfit: number;
	volume: number;
};

export type P2PWebSocketMessage = {
	p2p: {
		exchange: string;
		crypto: string;
		fiat: string;
		buyOrders: IP2POrder[];
		sellOrders: IP2POrder[];
		arbitrage: P2PArbitrage | null;
	};
};
