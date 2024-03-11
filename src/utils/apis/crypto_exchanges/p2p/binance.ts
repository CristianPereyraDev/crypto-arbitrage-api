import {
	IP2POrder,
	P2POrderType,
	P2PUserType,
} from "../../../../databases/model/exchange_p2p.model.js";
import { fetchWithTimeout } from "../../../../utils/network.utils.js";

/**
 * Success response from Binance P2P endpoint.
 */
export type BinanceP2PResponse = {
	code: string;
	message: string | null;
	messageDetail: string | null;
	data: BinanceP2POrder[] | null;
	total: number;
	success: boolean;
};

export type BinanceP2PAdvertiser = {
	userNo: string;
	nickName: string;
	proMerchant: string;
	userType: P2PUserType | null;
	monthOrderCount: number;
	monthFinishRate: number;
	positiveRate: number;
};

export type BinanceP2PAdvertisement = {
	advNo: string;
	tradeType: P2POrderType;
	price: string;
	maxSingleTransAmount: string;
	minSingleTransAmount: string;
	tradableQuantity: string;
	tradeMethods: BinanceP2PTradeMethod[];
};

export type BinanceP2PTradeMethod = {
	payId: string | null;
	payMethodId: string;
	payType: string | null;
	payAccount: string | null;
	payBank: string | null;
	paySubBank: string | null;
	identifier: string;
	iconUrlColor: string | null;
	tradeMethodName: string | null;
	tradeMethodShortName: string | null;
	tradeMethodBgColor: string;
};

export type BinanceP2PPostConfig = {
	fiat: string;
	page: number;
	rows: number;
	tradeType: P2POrderType;
	asset: string;
	countries: string[];
	proMerchantAds: boolean;
	shieldMerchantAds: boolean;
	publisherType: P2PUserType | null;
	payTypes: string[];
	classifies: string[];
};

export type BinanceP2POrder = {
	adv: BinanceP2PAdvertisement;
	advertiser: BinanceP2PAdvertiser;
};

async function fetchP2POrders(
	config: BinanceP2PPostConfig,
): Promise<BinanceP2PResponse> {
	try {
		const response = await fetchWithTimeout(
			"https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(config),
			},
		);

		if (!response.ok) {
			if (response.status === 404) throw new Error("404, Not found");
			if (response.status === 500)
				throw new Error("500, internal server error");

			throw new Error(`${response.status} ${response.statusText}`);
		}

		const jsonResponse = (await response.json()) as BinanceP2PResponse;

		return jsonResponse;
	} catch (error) {
		throw new Error(`Error on fetchP2POrders: ${error}`);
	}
}

function mapP2PResponse(apiResponse: BinanceP2PResponse): IP2POrder[] {
	if (apiResponse.data === null) {
		return [];
	}

	const mappedResponse = apiResponse.data.map((order: BinanceP2POrder) => {
		return {
			orderType: order.adv.tradeType,
			orderId: order.adv.advNo,
			volume: parseFloat(order.adv.tradableQuantity),
			price: parseFloat(order.adv.price),
			min: parseFloat(order.adv.minSingleTransAmount),
			max: parseFloat(order.adv.maxSingleTransAmount),
			payments: order.adv.tradeMethods.map((tradeMethod) => {
				return {
					slug: tradeMethod.identifier,
					name: tradeMethod.tradeMethodName,
				};
			}),
			userType: order.advertiser.userType,
			merchantId: order.advertiser.userNo,
			merchantName: order.advertiser.nickName,
			monthOrderCount: order.advertiser.monthOrderCount,
			monthFinishRate: order.advertiser.monthFinishRate,
			positiveRate: order.advertiser.positiveRate,
			link: "",
		};
	}) as IP2POrder[];

	return mappedResponse;
}

export async function getP2POrders(
	asset: string,
	fiat: string,
	tradeType: P2POrderType,
	publisherType: P2PUserType | null,
): Promise<IP2POrder[]> {
	const fetchConfig: BinanceP2PPostConfig = {
		fiat: fiat,
		page: 1,
		rows: 20,
		tradeType: tradeType === "BUY" ? P2POrderType.SELL : P2POrderType.BUY,
		asset: asset,
		countries: [],
		proMerchantAds: false,
		shieldMerchantAds: false,
		publisherType: publisherType,
		payTypes: [],
		classifies: ["mass", "profession"],
	};

	try {
		const firstOrder = await fetchP2POrders({
			...fetchConfig,
			rows: 1,
			page: 1,
		});

		const pages = Math.min(
			Math.ceil(firstOrder.total / fetchConfig.rows),
			Number(process.env.BINANCE_P2P_MAX_CONCURRENT_API_CALLS || "1"),
		);

		const results = await Promise.all(
			[...Array(pages).keys()].map((page) =>
				fetchP2POrders({ ...fetchConfig, page: page + 1 }),
			),
		);

		return results.flatMap((apiResponse) => mapP2PResponse(apiResponse));
	} catch (error) {
		throw new Error(
			`binance.getP2POrders error for pair ${asset}-${fiat}, ${error}`,
		);
	}
}
