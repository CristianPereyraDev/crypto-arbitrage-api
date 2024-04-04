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
	(pairs: IPair[]) => Promise<IExchangePairPrices[]>
>();
const brokeragePriceCollectors = new Map<
	string,
	(pairs: IPair[]) => Promise<IBrokeragePairPrices[]>
>();

// Exchange collectors
exchangePriceCollectors.set("Binance", binance.getSpotAskBidPrices);
exchangePriceCollectors.set("CryptoMarket", cryptomarket.getPairPrices);
exchangePriceCollectors.set("Ripio Trade", ripiotrade.getPairPrices);
exchangePriceCollectors.set("TruBit", trubit.getPairPrices);
exchangePriceCollectors.set("Bitso", bitso.getPairPrices);

// Brokerage collectors
brokeragePriceCollectors.set("Plus Crypto", pluscrypto.getPairPrices);
brokeragePriceCollectors.set("Bitmonedero", bitmonedero.getPairPrices);
brokeragePriceCollectors.set("Fiwind", fiwind.getPairPrices);
brokeragePriceCollectors.set("TiendaCrypto", tiendacrypto.getPairPrices);
brokeragePriceCollectors.set("satoshitango", satoshitango.getPairPrices);
brokeragePriceCollectors.set("Saldo", saldo.getPairPrices);
brokeragePriceCollectors.set("ArgenBTC", (pairs: IPair[]) =>
	cryptoya.getBrokeragePairPrices(pairs, "argenbtc"),
);
brokeragePriceCollectors.set("Lemon Cash", (pairs: IPair[]) =>
	cryptoya.getBrokeragePairPrices(pairs, "lemoncash"),
);
brokeragePriceCollectors.set("belo", (pairs: IPair[]) =>
	cryptoya.getBrokeragePairPrices(pairs, "belo"),
);

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
