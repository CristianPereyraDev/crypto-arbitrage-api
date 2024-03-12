import { IExchangeFeesDTO } from "../../types/dto/index.js";
import { type IExchangePairPricing } from "../../types/exchange.js";
import { IExchangePricingDTO } from "../../types/dto/index.js";
import ExchangeService from "../../services/exchanges.service.js";
import ExchangeRepositoryMongoDB from "../../repository/impl/exchange-repository-mongodb.js";
import BrokerageRepositoryMongoDB from "../../repository/impl/brokerage-repository-mongodb.js";
import { ExchangeP2PRepositoryMongoDB } from "../../repository/impl/exchange-p2p-repository-mongodb.js";
import {
	IP2POrder,
	P2POrderType,
	P2PUserType,
} from "../../databases/model/exchange_p2p.model.js";
import { ExchangeBaseRepositoryMongoBD } from "../../repository/impl/exchange-base-repository-mongodb.js";

const exchangeService = new ExchangeService(
	new ExchangeBaseRepositoryMongoBD(),
	new ExchangeRepositoryMongoDB(),
	new BrokerageRepositoryMongoDB(),
	new ExchangeP2PRepositoryMongoDB(),
);

export interface ICryptoArbitrageResult {
	askExchange: string;
	askPrice: number;
	bidExchange: string;
	bidPrice: number;
	profit: number;
	time: number;
}

export async function calculateArbitragesFromPairData(
	data: IExchangePairPricing | undefined,
): Promise<ICryptoArbitrageResult[]> {
	if (data === undefined) return [];

	const arbitrages: ICryptoArbitrageResult[] = [];

	// Get exchange fees. Se supone que los fees son porcentajes (hay que dividir por 100).
	const fees = await exchangeService.getAllFees();

	const exchangesArr: { exchange: string; value: IExchangePricingDTO }[] = [];
	data.forEach((value, exchange) => {
		exchangesArr.push({ exchange, value });
	});

	for (let i = 0; i < exchangesArr.length; i++) {
		const askExchange1 = exchangesArr[i].value.ask;
		const bidExchange1 = exchangesArr[i].value.bid;
		let totalAskExchange1 =
			exchangesArr[i].value.ask !== null ? exchangesArr[i].value.ask : 0;
		let totalBidExchange1 = exchangesArr[i].value.bid;

		const exchangeFees1 = Object.hasOwn(fees, exchangesArr[i].exchange)
			? fees[exchangesArr[i].exchange]
			: undefined;

		if (exchangeFees1 !== undefined) {
			const buyFeeExchange1 = Math.max(
				exchangeFees1.buyFee,
				exchangeFees1.takerFee,
			);

			const sellFeeExchange1 = Math.max(
				exchangeFees1.sellFee,
				exchangeFees1.takerFee,
			);

			totalAskExchange1 *= 1 + buyFeeExchange1 / 100;
			totalBidExchange1 *= 1 - sellFeeExchange1 / 100;
		}

		for (let j = i; j < exchangesArr.length; j++) {
			const askExchange2 = exchangesArr[j].value.ask;
			const bidExchange2 = exchangesArr[j].value.bid;
			let totalAskExchange2 = exchangesArr[j].value.ask;
			let totalBidExchange2 = exchangesArr[j].value.bid;

			const exchangeFees2 = Object.hasOwn(fees, exchangesArr[j].exchange)
				? fees[exchangesArr[j].exchange]
				: undefined;

			if (exchangeFees2 !== undefined) {
				const buyFeeExchange2 = Math.max(
					exchangeFees2.buyFee,
					exchangeFees2.takerFee,
				);

				const sellFeeExchange2 = Math.max(
					exchangeFees2.sellFee,
					exchangeFees2.takerFee,
				);

				totalAskExchange2 *= 1 + buyFeeExchange2 / 100;
				totalBidExchange2 *= 1 - sellFeeExchange2 / 100;
			}

			let [maxBidExchange, minAskExchange] = ["", ""];
			let [maxBid, maxTotalBid, minAsk, minTotalAsk] = [0, 0, 0, 0];

			if (totalBidExchange1 >= totalBidExchange2) {
				maxBidExchange = exchangesArr[i].exchange;
				maxBid = bidExchange1;
				maxTotalBid = totalBidExchange1;
			} else {
				maxBidExchange = exchangesArr[j].exchange;
				maxBid = bidExchange2;
				maxTotalBid = totalBidExchange2;
			}

			if (totalAskExchange1 <= totalAskExchange2) {
				minAskExchange = exchangesArr[i].exchange;
				minAsk = askExchange1;
				minTotalAsk = totalAskExchange1;
			} else {
				minAskExchange = exchangesArr[j].exchange;
				minAsk = askExchange2;
				minTotalAsk = totalAskExchange2;
			}

			// Check > 0 because some exchanges can have ask price = 0 or bid price = 0
			const profit =
				minAsk > 0 ? ((maxTotalBid - minTotalAsk) / minTotalAsk) * 100 : 0;

			if (profit > 0) {
				arbitrages.push({
					askExchange: minAskExchange,
					askPrice: minAsk,
					bidExchange: maxBidExchange,
					bidPrice: maxBid,
					profit: profit,
					time: Math.max(
						exchangesArr[i].value.time,
						exchangesArr[j].value.time,
					),
				});
			}
		}
	}

	return arbitrages;
}

export function calculateTotalBid({
	baseBid,
	fees,
	includeWithdrawalFiatFee,
}: {
	baseBid: number;
	fees?: IExchangeFeesDTO;
	includeWithdrawalFiatFee: boolean;
}) {
	if (fees !== undefined) {
		const totalFees = includeWithdrawalFiatFee
			? fees.sellFee + fees.withdrawalFiatFee
			: fees.sellFee;
		return baseBid * (1 - totalFees / 100);
	}
	return baseBid;
}

export function calculateTotalAsk({
	baseAsk,
	fees,
	includeDepositFiatFee,
}: {
	baseAsk: number;
	fees?: IExchangeFeesDTO;
	includeDepositFiatFee: boolean;
}) {
	if (fees !== undefined) {
		const totalFees = includeDepositFiatFee
			? fees.buyFee + fees.depositFiatFee
			: fees.buyFee;

		return baseAsk * (1 + totalFees / 100);
	}
	return baseAsk;
}

export type P2PArbitrage = {
	profit: number;
	suggestedBuyOrder: IP2POrder;
	suggestedSellOrder: IP2POrder;
};

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

export type CalculateP2PArbitrageParams = {
	buyOrders: IP2POrder[];
	sellOrders: IP2POrder[];
	volume: number;
	minProfit: number;
	userType: P2PUserType;
	sellLimits: [number, number];
	buyLimits: [number, number];
};

/**
 * Given buy orders and sell orders, calculate a P2P arbitrage.
 * @param params
 * @returns
 */
export function calculateP2PArbitrage(params: CalculateP2PArbitrageParams): {
	arbitrage: P2PArbitrage | null;
	sellOrders: IP2POrder[];
	buyOrders: IP2POrder[];
} {
	const arbitrage: P2PArbitrage = BASE_ARBITRAGE;
	const buyOrdersFiltered = params.buyOrders
		.filter((order) => order.userType === params.userType)
		.filter((order) => {
			const orderLimits: [number, number] = [order.min, order.max];

			return (
				(orderLimits[0] >= params.buyLimits[0] &&
					orderLimits[0] <= params.buyLimits[1]) ||
				(orderLimits[1] >= params.buyLimits[0] &&
					orderLimits[1] <= params.buyLimits[1])
			);
		});
	const sellOrdersFiltered = params.sellOrders
		.filter((order) => order.userType === params.userType)
		.filter((order) => {
			const orderLimits: [number, number] = [order.min, order.max];

			return (
				(orderLimits[0] >= params.sellLimits[0] &&
					orderLimits[0] <= params.sellLimits[1]) ||
				(orderLimits[1] >= params.sellLimits[0] &&
					orderLimits[1] <= params.sellLimits[1])
			);
		});

	if (buyOrdersFiltered.length === 0 || sellOrdersFiltered.length === 0) {
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
		arbitrage.suggestedSellOrder.min =
			params.volume * arbitrage.suggestedSellOrder.price * params.sellLimits[0];
		arbitrage.suggestedSellOrder.max =
			params.volume * arbitrage.suggestedSellOrder.price * params.sellLimits[1];
		arbitrage.suggestedBuyOrder.min =
			params.volume * arbitrage.suggestedBuyOrder.price * params.buyLimits[0];
		arbitrage.suggestedBuyOrder.max =
			params.volume * arbitrage.suggestedBuyOrder.price * params.buyLimits[1];

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
		arbitrage.suggestedSellOrder.min =
			params.volume * arbitrage.suggestedSellOrder.price * params.sellLimits[0];
		arbitrage.suggestedSellOrder.max =
			params.volume * arbitrage.suggestedSellOrder.price * params.sellLimits[1];
		arbitrage.suggestedBuyOrder.min =
			params.volume * arbitrage.suggestedBuyOrder.price * params.buyLimits[0];
		arbitrage.suggestedBuyOrder.max =
			params.volume * arbitrage.suggestedBuyOrder.price * params.buyLimits[1];

		return {
			arbitrage,
			sellOrders: sellOrdersFiltered,
			buyOrders: buyOrdersFiltered,
		};
	}

	return {
		arbitrage: null,
		sellOrders: params.sellOrders,
		buyOrders: params.buyOrders,
	};
}

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
