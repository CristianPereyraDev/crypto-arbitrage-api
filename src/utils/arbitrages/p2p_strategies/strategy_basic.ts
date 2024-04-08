import {
	IP2POrder,
	P2POrderType,
	P2PUserType,
} from "../../../databases/model/exchange_p2p.model.js";
import {
	CalculateP2PArbitrageParams,
	P2PArbitrageResult,
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
	): P2PArbitrageResult {
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
				sellOrders: [],
				buyOrders: [],
			};
		}

		let arbitrageFound = false;
		let buyOrderIndex = 0;
		let sellOrderIndex = 0;
		let profit = 0;
		while (
			sellOrderIndex < sellOrdersFiltered.length &&
			buyOrderIndex < buyOrdersFiltered.length &&
			!arbitrageFound
		) {
			profit = calculateP2PProfit(
				sellOrdersFiltered[sellOrderIndex][1].price - 0.01,
				buyOrdersFiltered[buyOrderIndex][1].price + 0.01,
			);
			if (profit >= params.minProfit) {
				arbitrageFound = true;
				arbitrage.suggestedSellOrder.volume = params.volume;
				arbitrage.suggestedSellOrder.min = params.sellLimits[0];
				arbitrage.suggestedSellOrder.max = params.sellLimits[1];
				arbitrage.suggestedSellOrder.price =
					sellOrdersFiltered[sellOrderIndex][1].price - 0.01;
				arbitrage.suggestedBuyOrder.volume = params.volume;
				arbitrage.suggestedBuyOrder.min = params.buyLimits[0];
				arbitrage.suggestedBuyOrder.max = params.buyLimits[1];
				arbitrage.suggestedBuyOrder.price =
					buyOrdersFiltered[buyOrderIndex][1].price + 0.01;
				arbitrage.profit = profit;
				arbitrage.sellOrderPosition = Math.max(0, sellOrderIndex - 1);
				arbitrage.buyOrderPosition = Math.max(0, buyOrderIndex - 1);
			} else if (buyOrderIndex <= sellOrderIndex) {
				buyOrderIndex++;
			} else {
				sellOrderIndex++;
			}
		}

		if (arbitrageFound) {
			return {
				arbitrage,
				sellOrders: sellOrdersFiltered
					.map((entry) => entry[1])
					.slice(0, Math.max(arbitrage.sellOrderPosition + 1, 20)),
				buyOrders: buyOrdersFiltered
					.map((entry) => entry[1])
					.slice(0, Math.max(arbitrage.buyOrderPosition + 1, 20)),
			};
		}

		return {
			arbitrage: null,
			sellOrders: sellOrdersFiltered.map((entry) => entry[1]).slice(0, 20),
			buyOrders: buyOrdersFiltered.map((entry) => entry[1]).slice(0, 20),
		};
	}
}
