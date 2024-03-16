import { IExchangePairPrices } from "../../../databases/model/exchange.model.js";
import { IPair } from "../../../databases/model/exchange_base.model.js";
import { fetchWithTimeout } from "../../../utils/network.utils.js";

type RipioTradeAPIResponse = {
	data: {
		asks: { price: number; amount: number; id: string }[];
		bids: { price: number; amount: number; id: string }[];
		timestamp: number;
	};
	error_code: number | null;
	message: string | null;
};

export async function getPairPrices(
	pairs: IPair[],
): Promise<IExchangePairPrices[] | undefined> {
	try {
		return await Promise.all<IExchangePairPrices>(
			pairs.map(
				(pair) =>
					new Promise((resolve) => {
						fetchWithTimeout(
							`https://api.ripiotrade.co/v4/public/orders/level-3?pair=${pair.crypto}_${pair.fiat}`,
						)
							.then((apiResponse) => {
								apiResponse.json().then((apiResponseJson) => {
									const data = (apiResponseJson as RipioTradeAPIResponse).data;
									resolve({
										crypto: pair.crypto,
										fiat: pair.fiat,
										asksAndBids: {
											asks: data.asks.map((ask) => [ask.price, ask.amount]),
											bids: data.bids.map((bid) => [bid.price, bid.amount]),
										},
									});
								});
							})
							.catch(() => {
								resolve({
									crypto: pair.crypto,
									fiat: pair.fiat,
									asksAndBids: {
										asks: [],
										bids: [],
									},
								});
							});
					}),
			),
		);
	} catch (error) {
		console.error(error);
	}
}
