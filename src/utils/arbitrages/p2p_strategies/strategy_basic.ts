import {
	IP2POrder,
	P2POrderType,
	P2PUserType,
} from "../../../databases/model/exchange_p2p.model.js";
import {
	CalculateP2PArbitrageParams,
	CalculateP2PArbitrageResult,
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
	buyOrderPosition: 0,
	sellOrderPosition: 0,
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
	calculateP2PArbitrage(
		params: CalculateP2PArbitrageParams,
	): CalculateP2PArbitrageResult {
		const buyConditions = [
			(order: IP2POrder) => order.userType === params.userType,
			(order: IP2POrder) => {
				return (
					params.buyLimits[0] >= order.min && params.buyLimits[0] <= order.max
				);
			},
		];
		const sellConditions = [
			(order: IP2POrder) => order.userType === params.userType,
			(order: IP2POrder) => {
				return (
					params.sellLimits[0] >= order.min && params.sellLimits[0] <= order.max
				);
			},
		];
		const arbitrage: P2PArbitrage = BASE_ARBITRAGE;

		const buyOrdersFiltered: [number, IP2POrder][] = [];
		for (const buyOrderEntry of params.buyOrders.entries()) {
			if (buyConditions.every((condition) => condition(buyOrderEntry[1]))) {
				buyOrdersFiltered.push(buyOrderEntry);
			}
		}
		const sellOrdersFiltered: [number, IP2POrder][] = [];
		for (const sellOrderEntry of params.sellOrders.entries()) {
			if (sellConditions.every((condition) => condition(sellOrderEntry[1]))) {
				sellOrdersFiltered.push(sellOrderEntry);
			}
		}

		if (buyOrdersFiltered.length === 0 || sellOrdersFiltered.length === 0) {
			return {
				arbitrage: null,
				sellOrders: params.sellOrders,
				buyOrders: params.buyOrders,
			};
		}

		arbitrage.suggestedSellOrder.price = sellOrdersFiltered[0][1].price - 0.01; // sell a little cheaper
		arbitrage.suggestedSellOrder.volume = params.volume;
		arbitrage.suggestedBuyOrder.price = buyOrdersFiltered[0][1].price + 0.01; // buy a little more expensive
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
			arbitrage.sellOrderPosition = sellOrdersFiltered[0][0];
			arbitrage.buyOrderPosition = buyOrdersFiltered[0][0];

			return {
				arbitrage,
				sellOrders: sellOrdersFiltered.map((entry) => entry[1]),
				buyOrders: buyOrdersFiltered.map((entry) => entry[1]),
			};
		}

		// Find the best sell order.
		for (const [index, sellOrder] of sellOrdersFiltered) {
			if (index === 0) {
				continue;
			}
			profit = calculateP2PProfit(
				sellOrder.price - 0.01,
				arbitrage.suggestedBuyOrder.price,
			);

			if (profit >= params.minProfit) {
				arbitrage.suggestedSellOrder.price = sellOrder.price - 0.01; // sell a little more cheaper
				arbitrage.profit = profit;
				arbitrage.sellOrderPosition = index;

				break;
			}
		}
		// Find the best buy order
		for (const [index, buyOrder] of buyOrdersFiltered) {
			if (index === 0) {
				continue;
			}
			profit = calculateP2PProfit(
				arbitrage.suggestedSellOrder.price,
				buyOrder.price + 0.01,
			);

			if (profit >= params.minProfit) {
				arbitrage.suggestedBuyOrder.price = buyOrder.price + 0.01; // buy a little more expensive
				arbitrage.profit = profit;
				arbitrage.buyOrderPosition = index;

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
				sellOrders: sellOrdersFiltered.map((entry) => entry[1]),
				buyOrders: buyOrdersFiltered.map((entry) => entry[1]),
			};
		}

		return {
			arbitrage: null,
			sellOrders: sellOrdersFiltered.map((entry) => entry[1]),
			buyOrders: buyOrdersFiltered.map((entry) => entry[1]),
		};
	}
}
