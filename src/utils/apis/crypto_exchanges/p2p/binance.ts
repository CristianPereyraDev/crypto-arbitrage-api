import {
	IP2POrder,
	P2POrderType,
	P2PUserType,
} from "../../../../databases/model/exchange_p2p.model.js";
import { fetchWithTimeout } from "../../../../utils/network.utils.js";

export type APIResponse = {
	code: string;
	message: string | null;
	messageDetail: string | null;
	data: BinanceP2POrderType[] | null;
	total?: number;
	success: boolean;
};

export type BinanceP2PTradeMethodType = {
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

export type BinanceP2POrderType = {
	adv: {
		advNo: string;
		tradeType: P2POrderType;
		price: string;
		maxSingleTransAmount: string;
		minSingleTransAmount: string;
		tradableQuantity: string;
		tradeMethods: BinanceP2PTradeMethodType[];
	};
	advertiser: {
		userNo: string;
		nickName: string;
		proMerchant: string;
		userType: P2PUserType | null;
		monthOrderCount: number;
		monthFinishRate: number;
		positiveRate: number;
	};
};

export type BinanceP2PPostData = {
	fiat: string;
	page: number;
	rows: number;
	tradeType: P2POrderType;
	asset: string;
	countries: string[];
	proMerchantAds: boolean;
	shieldMerchantAds: boolean;
	publisherType: P2PUserType;
	payTypes: string[];
	classifies: string[];
};

async function fetchP2PData(
	data: BinanceP2PPostData,
): Promise<APIResponse | undefined> {
	try {
		const response = await fetchWithTimeout(
			"https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			},
		);
		const jsonResponse = (await response.json()) as APIResponse;

		return jsonResponse;
	} catch (error) {
		console.log("Error on fetchP2PData:", error);
		return;
	}
}

function mapP2PResponse(apiResponse: APIResponse): IP2POrder[] {
	if (apiResponse.data === null) {
		return [];
	}

	const mappedResponse = apiResponse.data.map((order: BinanceP2POrderType) => {
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
	userType: P2PUserType,
): Promise<IP2POrder[] | undefined> {
	const data = {
		fiat: fiat,
		page: 1,
		rows: 20,
		tradeType: tradeType,
		asset: asset,
		countries: [],
		proMerchantAds: false,
		shieldMerchantAds: false,
		publisherType: userType,
		payTypes: [],
		classifies: ["mass", "profession"],
	};
	try {
		const firstOrder = await fetchP2PData({ ...data, rows: 1 });

		if (firstOrder?.success && firstOrder.total !== undefined) {
			const pages = Math.ceil(firstOrder.total / data.rows);

			const results = await Promise.all(
				[...Array(pages).keys()].map((page) =>
					fetchP2PData({ ...data, page: page + 1 }),
				),
			);

			return results.flatMap((apiResponse) =>
				apiResponse !== undefined ? mapP2PResponse(apiResponse) : [],
			);
		}

		console.error("Error:", firstOrder?.code);
		return undefined;
	} catch (error) {
		console.error(`Binance P2P error for pair ${asset}-${fiat}`, error);
		return undefined;
	}
}
