import { IExchangePairPrices } from "../../../databases/model/exchange.model.js";
import { IPair } from "../../../databases/model/exchange_base.model.js";
//import { fetchWithTimeout } from "../../../utils/network.utils.js";

export async function getPairPrices(
	pairs: IPair[],
): Promise<IExchangePairPrices[]> {
	// let asks: number[][] = [];
	// let bids: number[][] = [];

	// const responseBTCFiat = await fetchWithTimeout(
	// 	"https://sandbox.bitso.com/api/v3/order_book/?book=btc_ars",
	// );

	// if (responseBTCFiat.ok) {
	// 	const jsonResponseBTCFiat: any = await responseBTCFiat.json();

	// 	switch (baseAsset) {
	// 		case "BTC":
	// 			asks = jsonResponseBTCFiat.payload.asks.map((ask: any) => [
	// 				parseFloat(ask.price),
	// 				parseFloat(ask.amount),
	// 			]);
	// 			// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// 			bids = jsonResponseBTCFiat.payload.bids.map((bid: any) => [
	// 				parseFloat(bid.price),
	// 				parseFloat(bid.amount),
	// 			]);
	// 			break;
	// 		default:
	// 			// eslint-disable-next-line no-case-declarations
	// 			const responseAssetFiat = await fetch(
	// 				`https://sandbox.bitso.com/api/v3/ticker/?book=btc_${baseAsset.toLowerCase()}`,
	// 			);

	// 			if (responseAssetFiat.ok) {
	// 				// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// 				const jsonResponseBTCAsset: any = await responseAssetFiat.json();
	// 				const priceBTCAsset = parseFloat(jsonResponseBTCAsset.payload.bid);

	// 				// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// 				asks = jsonResponseBTCFiat.payload.asks.map((ask: any) => [
	// 					parseFloat(ask.price) / priceBTCAsset,
	// 					parseFloat(ask.amount),
	// 				]);
	// 				// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// 				bids = jsonResponseBTCFiat.payload.bids.map((bid: any) => [
	// 					parseFloat(bid.price) / priceBTCAsset,
	// 					parseFloat(bid.amount),
	// 				]);
	// 			} else {
	// 				return undefined;
	// 			}
	// 	}

	// 	return {
	// 		asks,
	// 		bids,
	// 	};
	// }
	return pairs.map((pair) => {
		return {
			crypto: pair.crypto,
			fiat: pair.fiat,
			asksAndBids: { asks: [], bids: [] },
		};
	});
}
