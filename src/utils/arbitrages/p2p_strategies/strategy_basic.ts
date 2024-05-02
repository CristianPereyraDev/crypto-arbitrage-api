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
		const {
			sellOrders,
			buyOrders,
			userType,
			nickName,
			volume,
			minProfit,
			maxSellOrderPosition,
			maxBuyOrderPosition,
			buyLimits,
			sellLimits,
		} = params;

		const arbitrage: P2PArbitrage = DEFAULT_ARBITRAGE;
		const orderListMaxSize =
			Number(process.env.P2P_ARBITRAGE_RESPONSE_ORDER_LIST_SIZE) + 1;
		const buyConditions = [
			(order: IP2POrder) => order.userType === userType,
			(order: IP2POrder) => {
				return buyLimits[0] >= order.min && buyLimits[0] <= order.max;
			},
		];
		const sellConditions = [
			(order: IP2POrder) => order.userType === userType,
			(order: IP2POrder) => {
				return sellLimits[0] >= order.min && sellLimits[0] <= order.max;
			},
		];
		const buyOrdersFiltered = buyOrders.filter(
			(order) =>
				buyConditions.every((c) => c(order)) || order.merchantName === nickName,
		);
		const sellOrdersFiltered = sellOrders.filter(
			(order) =>
				sellConditions.every((c) => c(order)) ||
				order.merchantName === nickName,
		);

		if (buyOrdersFiltered.length === 0 || sellOrdersFiltered.length === 0) {
			return { arbitrage: null, sellOrders: [], buyOrders: [] };
		}

		const locatedBuyOrderIndex = buyOrdersFiltered.findIndex(
			(buyOrder) => buyOrder.merchantName === nickName,
		);
		const locatedSellOrderIndex = sellOrdersFiltered.findIndex(
			(sellOrder) => sellOrder.merchantName === nickName,
		);

		// If both orders already exist in the filtered lists, calculate the arbitrage between them.
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
				sellOrders: sellOrdersFiltered.slice(
					0,
					Math.max(locatedSellOrderIndex + 1, orderListMaxSize),
				),
				buyOrders: buyOrdersFiltered.slice(
					0,
					Math.max(locatedBuyOrderIndex + 1, orderListMaxSize),
				),
			};
		}

		let arbitrageFound = false;
		let buyOrderHasReachedMaxPos = locatedBuyOrderIndex >= 0;
		let sellOrderHasReachedMaxPos = locatedSellOrderIndex >= 0;
		let buyOrderIndex = Math.max(0, locatedBuyOrderIndex);
		let sellOrderIndex = Math.max(0, locatedSellOrderIndex);
		let currentBuyOrder = buyOrdersFiltered[buyOrderIndex];
		let currentSellOrder = sellOrdersFiltered[sellOrderIndex];
		let profit = 0;
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

			if (profit >= minProfit) {
				arbitrageFound = true;
				if (locatedSellOrderIndex >= 0) {
					arbitrage.suggestedSellOrder = currentSellOrder;
				} else {
					arbitrage.suggestedSellOrder = {
						...DEFAULT_SUGGESTED_SELL_ORDER,
						volume: volume,
						min: sellLimits[0],
						max: sellLimits[1],
						price: sellPrice,
					};
				}
				if (locatedBuyOrderIndex >= 0) {
					arbitrage.suggestedBuyOrder = currentBuyOrder;
				} else {
					arbitrage.suggestedBuyOrder = {
						...DEFAULT_SUGGESTED_BUY_ORDER,
						volume: volume,
						min: buyLimits[0],
						max: buyLimits[1],
						price: buyPrice,
					};
				}
				arbitrage.profit = profit;
				arbitrage.sellOrderPosition = Math.max(0, sellOrderIndex);
				arbitrage.buyOrderPosition = Math.max(0, buyOrderIndex);
			} else if (!buyOrderHasReachedMaxPos && isBuyOrderTurn) {
				isBuyOrderTurn = false;
				if (
					buyOrderIndex < maxBuyOrderPosition &&
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
					sellOrderIndex < maxSellOrderPosition &&
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
					Math.max(arbitrage.sellOrderPosition + 1, orderListMaxSize),
				),
				buyOrders: buyOrdersFiltered.slice(
					0,
					Math.max(arbitrage.buyOrderPosition + 1, orderListMaxSize),
				),
			};
		}

		return {
			arbitrage: null,
			sellOrders: sellOrdersFiltered.slice(0, orderListMaxSize),
			buyOrders: buyOrdersFiltered.slice(0, orderListMaxSize),
		};
	}
}
