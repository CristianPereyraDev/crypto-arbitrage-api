import * as argenbtc from "./argenbtc.js";
import * as binance from "./binance.js";
import * as binancep2p from "./p2p/binance.js";
import * as bitmonedero from "./bitmonedero.js";
import * as cryptomarket from "./cryptomarket.js";
import * as ripiotrade from "./ripiotrade.js";
import * as saldo from "./saldo.js";
import * as trubit from "./trubit.js";
import * as bitso from "./bitso.js";
import * as pluscrypto from "./pluscrypto.js";
import * as fiwind from "./fiwind.js";
import * as tiendacrypto from "./tiendacrypto.js";
import * as satoshitango from "./satoshitango.js";
import * as cryptoya from "./cryptoya.js";

import {
	IP2POrder,
	P2POrderType,
	P2PUserType,
} from "../../../databases/model/exchange_p2p.model.js";
import { IExchangePairPrices } from "../../../databases/model/exchange.model.js";
import { IBrokeragePairPrices } from "../../../databases/model/brokerage.model.js";
import { IPair } from "../../../databases/model/exchange_base.model.js";

const exchangePriceCollectors = new Map<
	string,
	(pairs: IPair[]) => Promise<IExchangePairPrices[] | undefined>
>();
const brokeragePriceCollectors = new Map<
	string,
	(pairs: IPair[]) => Promise<IBrokeragePairPrices[] | undefined>
>();

// Exchange collectors
// priceCollectors.set('Bitget', getBitgetPairPrices) // Not implemented
exchangePriceCollectors.set("Binance", binance.getSpotAskBidPrices); // Implemented
exchangePriceCollectors.set("CryptoMarket", cryptomarket.getPairPrices); // Implemented
exchangePriceCollectors.set("Ripio Trade", ripiotrade.getPairPrices); // Implemented
exchangePriceCollectors.set("TruBit", trubit.getPairPrices); // Implemented
exchangePriceCollectors.set("Bitso", bitso.getPairPrices); // Implemented

// Brokerage collectors
brokeragePriceCollectors.set("ArgenBTC", argenbtc.getPairPrices); // Implemented
brokeragePriceCollectors.set("Plus Crypto", pluscrypto.getPairPrices); // Implemented
brokeragePriceCollectors.set("Bitmonedero", bitmonedero.getPairPrices); // Implemented
brokeragePriceCollectors.set("Fiwind", fiwind.getPairPrices); // Implemented
brokeragePriceCollectors.set("TiendaCrypto", tiendacrypto.getPairPrices); // Implemented
brokeragePriceCollectors.set("satoshitango", satoshitango.getPairPrices); // Implemented
brokeragePriceCollectors.set("Saldo", saldo.getPairPrices); // Implemented
brokeragePriceCollectors.set("Lemon Cash", (pairs: IPair[]) =>
	cryptoya.getBrokeragePairPrices(pairs, "lemoncash"),
); // Implemented
brokeragePriceCollectors.set("belo", (pairs: IPair[]) =>
	cryptoya.getBrokeragePairPrices(pairs, "belo"),
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
