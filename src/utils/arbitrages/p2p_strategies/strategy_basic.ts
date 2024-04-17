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

const DEFAULT_SUGGESTED_BUY_ORDER: IP2POrder = {
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
};

const DEFAULT_SUGGESTED_SELL_ORDER: IP2POrder = {
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
};

const DEFAULT_ARBITRAGE: P2PArbitrage = {
	profit: 0,
	suggestedBuyOrder: null,
	suggestedSellOrder: null,
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
		const { nickName, maxSellOrderPosition, maxBuyOrderPosition } = params;

		const arbitrage: P2PArbitrage = DEFAULT_ARBITRAGE;
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
		const buyOrdersFiltered = params.buyOrders.filter((order) =>
			buyConditions.every((c) => c(order)),
		);
		const sellOrdersFiltered = params.sellOrders.filter((order) =>
			sellConditions.every((c) => c(order)),
		);

		if (buyOrdersFiltered.length === 0 || sellOrdersFiltered.length === 0) {
			return { arbitrage: null, sellOrders: [], buyOrders: [] };
		}

		//
		const locatedBuyOrderIndex = buyOrdersFiltered.findIndex(
			(buyOrder) => buyOrder.merchantName === nickName,
		);
		const locatedSellOrderIndex = sellOrdersFiltered.findIndex(
			(sellOrder) => sellOrder.merchantName === nickName,
		);

		// If exist both orders in the filtered lists, calculate the arbitrage with them.
		if (locatedBuyOrderIndex >= 0 && locatedSellOrderIndex >= 0) {
			return {
				arbitrage: {
					profit: calculateP2PProfit(
						sellOrdersFiltered[locatedSellOrderIndex].price,
						buyOrdersFiltered[locatedBuyOrderIndex].price,
					),
					sellOrderPosition: locatedSellOrderIndex + 1,
					buyOrderPosition: locatedBuyOrderIndex + 1,
					suggestedSellOrder: sellOrdersFiltered[locatedSellOrderIndex],
					suggestedBuyOrder: buyOrdersFiltered[locatedBuyOrderIndex],
				},
				sellOrders: [],
				buyOrders: [],
			};
		}

		let arbitrageFound = false;
		let buyOrderIndex = Math.max(locatedBuyOrderIndex, 0);
		let sellOrderIndex = Math.max(locatedSellOrderIndex, 0);
		let currentBuyOrder = buyOrdersFiltered[buyOrderIndex];
		let currentSellOrder = sellOrdersFiltered[sellOrderIndex];
		let profit = 0;
		let buyOrderHasReachedMaxPos = locatedBuyOrderIndex >= 0;
		let sellOrderHasReachedMaxPos = locatedSellOrderIndex >= 0;
		let isBuyOrderTurn = true;

		while (
			(!buyOrderHasReachedMaxPos || !sellOrderHasReachedMaxPos) &&
			!arbitrageFound
		) {
			const sellPrice =
				locatedSellOrderIndex >= 0
					? currentSellOrder.price
					: currentSellOrder.price - 0.01;
			const buyPrice =
				locatedBuyOrderIndex >= 0
					? currentBuyOrder.price
					: currentBuyOrder.price + 0.01;
			profit = calculateP2PProfit(sellPrice, buyPrice);
			if (profit >= params.minProfit) {
				arbitrageFound = true;
				if (locatedSellOrderIndex >= 0) {
					arbitrage.suggestedSellOrder = currentSellOrder;
				} else {
					arbitrage.suggestedSellOrder = {
						...DEFAULT_SUGGESTED_SELL_ORDER,
						volume: params.volume,
						min: params.sellLimits[0],
						max: params.sellLimits[1],
						price: sellPrice,
					};
				}
				if (locatedBuyOrderIndex >= 0) {
					arbitrage.suggestedBuyOrder = currentBuyOrder;
				} else {
					arbitrage.suggestedBuyOrder = {
						...DEFAULT_SUGGESTED_BUY_ORDER,
						volume: params.volume,
						min: params.buyLimits[0],
						max: params.buyLimits[1],
						price: buyPrice,
					};
				}
				arbitrage.profit = profit;
				arbitrage.sellOrderPosition = Math.max(0, sellOrderIndex);
				arbitrage.buyOrderPosition = Math.max(0, buyOrderIndex);
			} else if (!buyOrderHasReachedMaxPos && isBuyOrderTurn) {
				isBuyOrderTurn = false;
				if (
					buyOrderIndex < maxBuyOrderPosition - 1 &&
					buyOrderIndex + 1 < buyOrdersFiltered.length
				) {
					buyOrderIndex++;
					currentBuyOrder = buyOrdersFiltered[buyOrderIndex];
				} else {
					buyOrderHasReachedMaxPos = true;
				}
			} else {
				isBuyOrderTurn = true;
				if (
					sellOrderIndex < maxSellOrderPosition - 1 &&
					sellOrderIndex + 1 < sellOrdersFiltered.length
				) {
					sellOrderIndex++;
					currentSellOrder = sellOrdersFiltered[sellOrderIndex];
				} else {
					sellOrderHasReachedMaxPos = true;
				}
			}
		}

		if (arbitrageFound) {
			return {
				arbitrage,
				sellOrders: sellOrdersFiltered.slice(
					0,
					Math.max(arbitrage.sellOrderPosition + 1, 20),
				),
				buyOrders: buyOrdersFiltered.slice(
					0,
					Math.max(arbitrage.buyOrderPosition + 1, 20),
				),
			};
		}

		return {
			arbitrage: null,
			sellOrders: sellOrdersFiltered.slice(0, 20),
			buyOrders: buyOrdersFiltered.slice(0, 20),
		};
	}
}
