import { IExchangeBase, IPair } from "./exchange_base.model.js";

export enum P2POrderType {
	BUY = "BUY",
	SELL = "SELL",
}

export enum P2PUserType {
	user = "user",
	merchant = "merchant",
}

export interface IPaymentMethod {
	slug: string;
	name: string;
}

export interface IP2POrder {
	orderType: P2POrderType;
	orderId: string;
	volume: number;
	price: number;
	min: number;
	max: number;
	payments: IPaymentMethod[];
	// USER PROPERTIES //
	userType: P2PUserType;
	merchantId: string;
	merchantName: string;
	monthOrderCount: number;
	monthFinishRate: number;
	positiveRate: number;
	link: string;
}

export interface IP2PPairOrders extends IPair {
	buyOrders: IP2POrder[];
	sellOrders: IP2POrder[];
}

export interface IP2PExchange extends IExchangeBase {
	ordersByPair: IP2PPairOrders[];
}
