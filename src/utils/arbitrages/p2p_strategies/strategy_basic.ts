import {
	P2POrderType,
	P2PUserType,
} from "../../../databases/model/exchange_p2p.model.js";
import {
	CalculateP2PArbitrageParams,
	IP2PArbitrageStrategy,
	P2PArbitrage,
} from "./types.js";

const BASE_ARBITRAGE: P2PArbitrage = {
	profit: 0,
	suggestedBuyOrder: {
		orderType: P2POrderType.BUY,
		orderId: "arbitrage_buy",
		volume: 1,
		price: 0,
		min: 0,
		max: 0,
		payments: [],
		userType: P2PUserType.merchant,
		merchantId: "",
		merchantName: "CryptoARbitrage",
		monthOrderCount: 0,
		monthFinishRate: 0,
		positiveRate: 1,
		link: "",
	},
	suggestedSellOrder: {
		orderType: P2POrderType.SELL,
		orderId: "arbitrage_sell",
		volume: 1,
		price: 0,
		min: 0,
		max: 0,
		payments: [],
		userType: P2PUserType.merchant,
		merchantId: "",
		merchantName: "CryptoARbitrage",
		monthOrderCount: 0,
		monthFinishRate: 0,
		positiveRate: 1,
		link: "",
	},
};

/**
 *
 * @param sellPrice number that represents the amount of fiat units needed to sell an asset
 * @param buyPrice number that represents the amount of fiat units needed to buy an asset
 * @returns number that represents the profit in percentage. For example, for an volume(v) = 500USDT,
 * 1% means an profit = 0.01USDT * 500 = 5USDT
 */
function calculateP2PProfit(sellPrice: number, buyPrice: number) {
	return ((sellPrice - buyPrice) / buyPrice) * 100;
}

export class BasicStrategy implements IP2PArbitrageStrategy {
	calculateP2PArbitrage(params: CalculateP2PArbitrageParams) {
		console.log("BasicStrategy", params.buyLimits, params.sellLimits);
		const arbitrage: P2PArbitrage = BASE_ARBITRAGE;

		// Filter orders
		const buyOrdersFiltered = params.buyOrders
			.filter((order) => order.userType === params.userType)
			.filter((order) => {
				console.log(order.min, params.buyLimits[0], order.max);
				console.log(
					typeof order.min,
					typeof params.buyLimits[0],
					typeof order.max,
				);
				return (
					params.buyLimits[0] >= order.min && params.buyLimits[0] <= order.max
				);
			});
		const sellOrdersFiltered = params.sellOrders
			.filter((order) => order.userType === params.userType)
			.filter((order) => {
				return (
					params.sellLimits[0] >= order.min && params.sellLimits[0] <= order.max
				);
			});

		if (buyOrdersFiltered.length === 0 || sellOrdersFiltered.length === 0) {
			console.log(
				"buyOrdersFiltered",
				buyOrdersFiltered.length,
				"sellOrdersFiltered",
				sellOrdersFiltered.length,
			);
			return {
				arbitrage: null,
				sellOrders: params.sellOrders,
				buyOrders: params.buyOrders,
			};
		}

		arbitrage.suggestedSellOrder.price = sellOrdersFiltered[0].price - 0.01; // sell a little cheaper
		arbitrage.suggestedSellOrder.volume = params.volume;
		arbitrage.suggestedBuyOrder.price = buyOrdersFiltered[0].price + 0.01; // buy a little more expensive
		arbitrage.suggestedBuyOrder.volume = params.volume;

		let profit = calculateP2PProfit(
			arbitrage.suggestedSellOrder.price,
			arbitrage.suggestedBuyOrder.price,
		);

		if (profit >= params.minProfit) {
			arbitrage.profit = profit;
			arbitrage.suggestedSellOrder.min = params.sellLimits[0];
			arbitrage.suggestedSellOrder.max = params.sellLimits[1];
			arbitrage.suggestedBuyOrder.min = params.buyLimits[0];
			arbitrage.suggestedBuyOrder.max = params.buyLimits[1];

			return {
				arbitrage,
				sellOrders: sellOrdersFiltered,
				buyOrders: buyOrdersFiltered,
			};
		}

		// Find the best sell order.
		for (const sellOrder of sellOrdersFiltered.slice(1)) {
			profit = calculateP2PProfit(
				sellOrder.price - 0.01,
				arbitrage.suggestedBuyOrder.price,
			);

			if (profit >= params.minProfit) {
				arbitrage.suggestedSellOrder.price = sellOrder.price - 0.01; // sell a little more cheaper
				arbitrage.profit = profit;

				break;
			}
		}
		// Find the best buy order
		for (const buyOrder of buyOrdersFiltered.slice(1)) {
			profit = calculateP2PProfit(
				arbitrage.suggestedSellOrder.price,
				buyOrder.price + 0.01,
			);

			if (profit >= params.minProfit) {
				arbitrage.suggestedBuyOrder.price = buyOrder.price + 0.01; // buy a little more expensive
				arbitrage.profit = profit;

				break;
			}
		}

		if (arbitrage.profit >= params.minProfit) {
			arbitrage.suggestedSellOrder.min = params.sellLimits[0];
			arbitrage.suggestedSellOrder.max = params.sellLimits[1];
			arbitrage.suggestedBuyOrder.min = params.buyLimits[0];
			arbitrage.suggestedBuyOrder.max = params.buyLimits[1];

			return {
				arbitrage,
				sellOrders: sellOrdersFiltered,
				buyOrders: buyOrdersFiltered,
			};
		}

		return {
			arbitrage: null,
			sellOrders: sellOrdersFiltered,
			buyOrders: buyOrdersFiltered,
		};
	}
}
