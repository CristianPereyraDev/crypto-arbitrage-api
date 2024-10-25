import { describe, expect, test } from '@jest/globals';

import ExchangeRepositoryMongoDB, {
  calculateOrderBookAvgPrice,
} from '../../../repository/impl/exchange-repository-mongodb.js';
import orderbook from './orderbook.json';

describe('Exchange repository', () => {
  const repository = new ExchangeRepositoryMongoDB();

  test('Avg price for empty order book', () => {
    const avgPrice = calculateOrderBookAvgPrice([], 1);

    expect(avgPrice).toBe(0);
  });

  test('Avg price when volume is equal to the first order quantity', () => {
    const avgPrice = calculateOrderBookAvgPrice(orderbook, 0.00008);

    expect(avgPrice).toBeCloseTo(86329926);
  });

  test('Avg price when volume can be satisfied for the orders', () => {
    const avgPrice = calculateOrderBookAvgPrice(orderbook, 0.01791);

    expect(avgPrice).toBeCloseTo(86219071.61306532);
  });

  test('Avg price when volume can be satisfied for the three firsts orders and a portion of the four order', () => {
    const avgPrice = calculateOrderBookAvgPrice(orderbook, 0.02);

    expect(avgPrice).toBeCloseTo(86178895.061);
  });

  test("Avg price when volume can't be satisfied for the order book.", () => {
    const avgPrice = calculateOrderBookAvgPrice(orderbook, 0.05);

    expect(avgPrice).toBeCloseTo(86012705.93971539);
  });
});
