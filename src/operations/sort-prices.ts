import { IExchangePricingDTO } from '../types/dto/index.js';

export function sortPricesByAsk(prices: IExchangePricingDTO[]) {
  return [...prices].sort((p1, p2) =>
    p1.ask && p2.ask ? p1.ask - p2.ask : p1.ask ? -1 : 1
  );
}

export function sortPricesByBid(prices: IExchangePricingDTO[]) {
  return [...prices].sort((p1, p2) =>
    p1.bid && p2.bid ? p2.bid - p1.bid : p1.bid ? -1 : 1
  );
}
