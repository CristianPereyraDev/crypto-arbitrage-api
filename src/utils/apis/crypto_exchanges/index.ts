import * as argenbtc from "./argenbtc.js";
import * as binance from "./binance.js";
import * as binancep2p from "./p2p/binance.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getBitgetPairPrices } from "./p2p/bitget.js";
import * as bitmonedero from "./bitmonedero.js";
import * as cryptomarket from "./cryptomarket.js";
import * as ripiotrade from "./ripiotrade.js";
import * as saldo from "./saldo.js";
import * as trubit from "./trubit.js";
import * as bitso from "./bitso.js";
import * as pluscrypto from "./pluscrypto.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as bybit from "./bybit.js";
import * as fiwind from "./fiwind.js";
import * as tiendacrypto from "./tiendacrypto.js";
import * as satoshitango from "./satoshitango.js";
import * as cryptoya from "./cryptoya.js";

import {
	IP2POrder,
	P2POrderType,
	P2PUserType,
} from "../../../databases/model/exchange_p2p.model.js";

/**
 * bids & asks are arrays like -> [[price, qty], [price, qty], ...]
 */
export type ExchangeCollectorReturnType = {
	bids: number[][];
	asks: number[][];
};

export type BrokerageCollectorReturnType = {
	ask: number;
	bid: number;
};

export type ExchangeCollectorType = (
	baseAsset: string,
	quoteAsset: string,
) => Promise<ExchangeCollectorReturnType | undefined>;

export type BrokerageCollectorType = (
	baseAsset: string,
	quoteAsset: string,
) => Promise<BrokerageCollectorReturnType | undefined>;

const exchangePriceCollectors = new Map<string, ExchangeCollectorType>();
const brokeragePriceCollectors = new Map<string, BrokerageCollectorType>();

// Exchange collectors
exchangePriceCollectors.set("Binance", binance.getSpotAskBidPrices); // Implemented
// priceCollectors.set('Bitget', getBitgetPairPrices) // Not implemented
exchangePriceCollectors.set("CryptoMarket", cryptomarket.getPairPrices); // Implemented
exchangePriceCollectors.set("Ripio Trade", ripiotrade.getPairPrices); // Implemented
exchangePriceCollectors.set("TruBit", trubit.getPairPrices); // Implemented
exchangePriceCollectors.set("Bitso", bitso.getPairPrices); // Implemented
//bybit.getPairPrices()

// Brokerage collectors
brokeragePriceCollectors.set("Plus Crypto", pluscrypto.getPairPrices); // Implemented
brokeragePriceCollectors.set("ArgenBTC", argenbtc.getPairPrices); // Implemented
brokeragePriceCollectors.set("Bitmonedero", bitmonedero.getPairPrices); // Implemented
brokeragePriceCollectors.set("Fiwind", fiwind.getPairPrices); // Implemented
brokeragePriceCollectors.set("TiendaCrypto", tiendacrypto.getPairPrices); // Implemented
brokeragePriceCollectors.set("satoshitango", satoshitango.getPairPrices); // Implemented
brokeragePriceCollectors.set("Saldo", saldo.getPairPrices); // Implemented
brokeragePriceCollectors.set("Lemon Cash", (baseAsset, quoteAsset) =>
	cryptoya.getBrokeragePairPrices(baseAsset, quoteAsset, "lemoncash"),
); // Implemented
brokeragePriceCollectors.set("belo", (baseAsset, quoteAsset) =>
	cryptoya.getBrokeragePairPrices(baseAsset, quoteAsset, "belo"),
); // Implemented

// P2P Exchange collectors
export type P2PCollectorFunctionType = (
	asset: string,
	fiat: string,
	tradeType: P2POrderType,
	publisherType: P2PUserType | null,
) => Promise<IP2POrder[]>;

const p2pOrderCollectors = new Map<string, P2PCollectorFunctionType>();

p2pOrderCollectors.set("Binance P2P", binancep2p.getP2POrders);

export {
	exchangePriceCollectors,
	brokeragePriceCollectors,
	p2pOrderCollectors,
};
