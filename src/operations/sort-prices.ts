import { IExchangePricingDTO } from '../types/dto/index.js';

export function sortPricesByAsk(prices: IExchangePricingDTO[]) {
  return [...prices].sort((p1, p2) =>
    p1.totalAsk && p2.totalAsk
      ? p1.totalAsk - p2.totalAsk
      : p1.totalAsk
      ? -1
      : 1
  );
}

export function sortPricesByBid(prices: IExchangePricingDTO[]) {
  return [...prices].sort((p1, p2) =>
    p1.totalBid && p2.totalBid
      ? p2.totalBid - p1.totalBid
      : p1.totalBid
      ? -1
      : 1
  );
}
