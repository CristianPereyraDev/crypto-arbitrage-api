import { describe, expect, test } from '@jest/globals';

import { getP2PProfit } from '../../operations/profits.js';

const binanceP2PAskFee = 0.0016;
const binanceP2PBidFee = 0.0016;

describe('Profits calculation', () => {
  test('P2P profit for Binance', () => {
    expect(
      getP2PProfit(500, 1209.09, 1203.05, binanceP2PAskFee, binanceP2PBidFee)
        .profit
    ).toBeCloseTo(0.903539866);
  });
});
