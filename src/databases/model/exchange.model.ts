import { IPair, IExchangeBase } from "./exchange_base.model.js";

/**
 * Asks and bids are arrays of arrays like [[price, qty], [price, qty], ...]
 */
export interface IAskBid {
	asks: number[][];
	bids: number[][];
	createdAt?: Date;
}

export interface IExchangePairPrices extends IPair {
	asksAndBids: IAskBid;
}

export interface IExchange extends IExchangeBase {
	pricesByPair: IExchangePairPrices[];
}
