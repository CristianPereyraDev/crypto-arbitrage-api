import { describe, expect, test } from "@jest/globals";
import orders from "./orders.json";
import {
	IP2POrder,
	P2POrderType,
	P2PUserType,
} from "../../../../databases/model/exchange_p2p.model.js";
import { BasicStrategy } from "../../../../utils/arbitrages/p2p_strategies/strategy_basic.js";
import { CalculateP2PArbitrageParams } from "../../../../utils/arbitrages/p2p_strategies/types.js";

describe("P2P arbitrage basic strategy", () => {
	const buyOrders: IP2POrder[] = orders.buyOrders.map((jsonOrder) => {
		return {
			...jsonOrder,
			orderType: jsonOrder.orderType as P2POrderType,
			userType: jsonOrder.userType as P2PUserType,
		};
	});
	const sellOrders: IP2POrder[] = orders.sellOrders.map((jsonOrder) => {
		return {
			...jsonOrder,
			orderType: jsonOrder.orderType as P2POrderType,
			userType: jsonOrder.userType as P2PUserType,
		};
	});
	const defaultParams: CalculateP2PArbitrageParams = {
		buyOrders,
		sellOrders,
		volume: 1000,
		minProfit: 0.5,
		userType: P2PUserType.merchant,
		sellLimits: [100000, 1000000],
		buyLimits: [100000, 1000000],
		maxBuyOrderPosition: 10,
		maxSellOrderPosition: 30,
	};
	const basicStrategy = new BasicStrategy();

	test("Arbitrage for user rama1517", () => {
		const arbitrage = basicStrategy.calculateP2PArbitrage({
			...defaultParams,
			nickName: "rama1517",
		});

		expect(arbitrage.arbitrage?.buyOrderPosition).toBe(1);
	});

	test("Arbitrage for user Altamira Capital", () => {
		const arbitrage = basicStrategy.calculateP2PArbitrage({
			...defaultParams,
			nickName: "Altamira Capital",
		});

		expect(arbitrage.arbitrage?.buyOrderPosition).toBe(4);
	});

	test("Arbitrage for user FastSchell_", () => {
		const arbitrage = basicStrategy.calculateP2PArbitrage({
			...defaultParams,
			nickName: "FastSchell_",
		});

		expect(arbitrage.arbitrage?.buyOrderPosition).toBe(10);
		expect(arbitrage.arbitrage?.sellOrderPosition).toBe(23);
		expect(arbitrage.arbitrage?.profit).toBeCloseTo(
			(1091.99 / 1086.55 - 1) * 100,
		);
	});

	test("Arbitrage for user Rubito79", () => {
		const result = basicStrategy.calculateP2PArbitrage({
			...defaultParams,
			nickName: "Rubito79",
		});

		expect(result.arbitrage?.sellOrderPosition).toBe(2);
		expect(result.arbitrage?.buyOrderPosition).toBe(16);
		expect(result.arbitrage?.profit).toBeCloseTo(0.15);
	});
});
