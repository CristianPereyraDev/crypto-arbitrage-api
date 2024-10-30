import { describe, expect, test } from '@jest/globals';
import orders from './orders.json';
import {
  IP2POrder,
  P2POrderType,
  P2PUserType,
} from '../../../../data/model/exchange_p2p.model.js';
import { BasicStrategy } from '../../../../arbitrages/p2p_strategies/strategy_basic.js';
import { CalculateP2PArbitrageParams } from '../../../../arbitrages/p2p_strategies/types.js';

describe('P2P arbitrage basic strategy', () => {
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
    sellLimits: [10000, 100000000],
    buyLimits: [10000, 100000000],
    maxBuyOrderPosition: 10,
    maxSellOrderPosition: 30,
  };
  const basicStrategy = new BasicStrategy();

  test('Arbitrage for user rama1517', () => {
    const arbitrage = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: 'rama1517',
    });

    expect(arbitrage.arbitrage?.buyOrderPosition).toBe(1);
  });

  test('Arbitrage for user Altamira Capital', () => {
    const arbitrage = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: 'Altamira Capital',
    });

    expect(arbitrage.arbitrage?.buyOrderPosition).toBe(4);
  });

  test('Arbitrage for user FastSchell_', () => {
    const arbitrage = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: 'FastSchell_',
    });

    expect(arbitrage.arbitrage?.buyOrderPosition).toBe(10);
    expect(arbitrage.arbitrage?.sellOrderPosition).toBe(24);
    expect(arbitrage.arbitrage?.profit).toBeCloseTo(
      (1091.99 / 1086.55 - 1) * 100
    );
  });

  test('Arbitrage for user Rubito79', () => {
    const result = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: 'Rubito79',
    });

    expect(result.arbitrage?.sellOrderPosition).toBe(2);
    expect(result.arbitrage?.buyOrderPosition).toBe(16);
    expect(result.arbitrage?.profit).toBeCloseTo(0.15);
  });

  test.only('Arbitrage for no user', () => {
    const result = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: undefined,
      minProfit: 0.17,
    });

    expect(result.arbitrage?.sellOrderPosition).toBe(9);
    expect(result.arbitrage?.buyOrderPosition).toBe(10);
    expect(result.arbitrage?.profit).toBeCloseTo(0.175);
    expect(result.sellOrders.length).toBe(20);
    expect(result.sellOrders[8].merchantName).toBe('CryptoARbitrage');
    expect(result.sellOrders[8].orderType).toBe('SELL');
    expect(result.buyOrders.length).toBe(20);
    expect(result.buyOrders[9].merchantName).toBe('CryptoARbitrage');
    expect(result.buyOrders[9].orderType).toBe('BUY');
  });

  test('Arbitrage for minProfit = 1 and max positions = 10 should be null', () => {
    const result = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: undefined,
      minProfit: 1,
      maxBuyOrderPosition: 10,
      maxSellOrderPosition: 10,
    });

    expect(result.arbitrage).toBeNull();
  });

  test('Arbitrage with max positions undefined and user kirkklax', () => {
    const result = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: 'kirkklax',
      minProfit: 1,
      maxBuyOrderPosition: undefined,
      maxSellOrderPosition: undefined,
    });

    expect(result.arbitrage?.profit).toBeGreaterThanOrEqual(1);
    expect(result.arbitrage?.suggestedSellOrder?.merchantName).toBe('kirkklax');
  });

  test('Arbitrage with max positions undefined and user FraYu', () => {
    const result = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: 'FraYu',
      minProfit: 1,
      maxBuyOrderPosition: undefined,
      maxSellOrderPosition: undefined,
    });

    expect(result.arbitrage?.profit).toBeGreaterThanOrEqual(1);
    expect(result.arbitrage?.suggestedSellOrder?.merchantName).toBe('FraYu');
    expect(result.arbitrage?.suggestedBuyOrder?.merchantName).toBe('FraYu');
  });

  test('Arbitrage with max positions undefined and user lakshmy07', () => {
    const result = basicStrategy.calculateP2PArbitrage({
      ...defaultParams,
      nickName: 'lakshmy07',
      minProfit: 1,
      maxBuyOrderPosition: undefined,
      maxSellOrderPosition: undefined,
    });

    expect(result.arbitrage?.profit).toBeGreaterThanOrEqual(1);
    expect(
      result.arbitrage?.suggestedSellOrder?.merchantName === 'lakshmy07'
    ).toBeFalsy();
    expect(result.arbitrage?.suggestedBuyOrder?.merchantName).toBe('lakshmy07');
  });
});
