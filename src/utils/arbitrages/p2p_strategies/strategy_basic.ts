import { getP2PProfit } from '../../../operations/profits.js';
import {
  IP2POrder,
  P2POrderType,
  P2PUserType,
} from '../../../data/model/exchange_p2p.model.js';
import {
  CalculateP2PArbitrageParams,
  P2PArbitrageResult,
  IP2PArbitrageStrategy,
  P2PArbitrage,
} from './types.js';

export const DEFAULT_SUGGESTED_BUY_ORDER: IP2POrder = {
  orderType: P2POrderType.BUY,
  orderId: 'arbitrage_buy',
  volume: 1,
  price: 0,
  min: 0,
  max: 0,
  payments: [],
  userType: P2PUserType.merchant,
  merchantId: '',
  merchantName: 'CryptoARbitrage',
  monthOrderCount: 0,
  monthFinishRate: 0,
  positiveRate: 1,
  link: '',
};

export const DEFAULT_SUGGESTED_SELL_ORDER: IP2POrder = {
  orderType: P2POrderType.SELL,
  orderId: 'arbitrage_sell',
  volume: 1,
  price: 0,
  min: 0,
  max: 0,
  payments: [],
  userType: P2PUserType.merchant,
  merchantId: '',
  merchantName: 'CryptoARbitrage',
  monthOrderCount: 0,
  monthFinishRate: 0,
  positiveRate: 1,
  link: '',
};

export const DEFAULT_ARBITRAGE: P2PArbitrage = {
  profit: 0,
  suggestedBuyOrder: null,
  suggestedSellOrder: null,
  buyOrderPosition: 0,
  sellOrderPosition: 0,
};

export function getUserOrders(
  orders: IP2POrder[],
  nickName?: string
): IP2POrder[] {
  return orders.filter((order) => order.merchantName === nickName);
}

export function isRangesOverlapping(
  rangeA: number[],
  rangeB: number[]
): boolean {
  return !(rangeA[0] > rangeB[1] || rangeA[1] < rangeB[0]);
}

export class BasicStrategy implements IP2PArbitrageStrategy {
  calculateP2PArbitrage({
    sellOrders,
    buyOrders,
    userType,
    buyLimits,
    sellLimits,
    nickName,
    volume,
    minProfit,
    maxSellOrderPosition,
    maxBuyOrderPosition,
  }: CalculateP2PArbitrageParams): P2PArbitrageResult {
    const arbitrage: P2PArbitrage = DEFAULT_ARBITRAGE;
    const orderListMaxSize = Number(
      process.env.P2P_ARBITRAGE_RESPONSE_ORDER_LIST_SIZE ?? 20
    );

    const userBuyOrders = getUserOrders(buyOrders, nickName);
    const userSellOrders = getUserOrders(sellOrders, nickName);

    const finalBuyLimits =
      userBuyOrders.length > 0
        ? [userBuyOrders[0].min, userBuyOrders[0].max]
        : buyLimits;
    const finalSellLimits =
      userSellOrders.length > 0
        ? [userSellOrders[0].min, userSellOrders[0].max]
        : sellLimits;

    const buyConditions = [
      (order: IP2POrder) => order.userType === userType,
      (order: IP2POrder) =>
        isRangesOverlapping(finalBuyLimits, [order.min, order.max]),
    ];
    const sellConditions = [
      (order: IP2POrder) => order.userType === userType,
      (order: IP2POrder) =>
        isRangesOverlapping(finalSellLimits, [order.min, order.max]),
    ];

    const buyOrdersFiltered = buyOrders.filter(
      (order) =>
        order.merchantName === nickName || buyConditions.every((c) => c(order))
    );
    const sellOrdersFiltered = sellOrders.filter(
      (order) =>
        order.merchantName === nickName || sellConditions.every((c) => c(order))
    );

    if (buyOrdersFiltered.length === 0 || sellOrdersFiltered.length === 0) {
      return { arbitrage: null, sellOrders: [], buyOrders: [] };
    }

    const locatedBuyOrderIndex = buyOrdersFiltered.findIndex(
      (buyOrder) => buyOrder.merchantName === nickName
    );
    const locatedSellOrderIndex = sellOrdersFiltered.findIndex(
      (sellOrder) => sellOrder.merchantName === nickName
    );

    // If both orders already exist in the filtered lists, calculate the arbitrage between them.
    if (locatedBuyOrderIndex >= 0 && locatedSellOrderIndex >= 0) {
      return {
        arbitrage: {
          profit: getP2PProfit(
            volume,
            sellOrdersFiltered[locatedSellOrderIndex].price,
            buyOrdersFiltered[locatedBuyOrderIndex].price,
            0.0016,
            0.0016
          ).profitPercent,
          sellOrderPosition: locatedSellOrderIndex + 1,
          buyOrderPosition: locatedBuyOrderIndex + 1,
          suggestedSellOrder: sellOrdersFiltered[locatedSellOrderIndex],
          suggestedBuyOrder: buyOrdersFiltered[locatedBuyOrderIndex],
        },
        sellOrders: sellOrdersFiltered.slice(
          0,
          Math.max(locatedSellOrderIndex + 1, orderListMaxSize)
        ),
        buyOrders: buyOrdersFiltered.slice(
          0,
          Math.max(locatedBuyOrderIndex + 1, orderListMaxSize)
        ),
      };
    }

    let arbitrageFound = false;
    let buyOrderHasReachedMaxPos = locatedBuyOrderIndex >= 0;
    let sellOrderHasReachedMaxPos = locatedSellOrderIndex >= 0;
    let buyOrderIndex = Math.max(0, locatedBuyOrderIndex);
    let sellOrderIndex = Math.max(0, locatedSellOrderIndex);
    let currentBuyOrder = buyOrdersFiltered[buyOrderIndex];
    let currentSellOrder = sellOrdersFiltered[sellOrderIndex];
    let profit = 0;
    let isBuyOrderTurn = true;

    while (
      (!buyOrderHasReachedMaxPos || !sellOrderHasReachedMaxPos) &&
      !arbitrageFound
    ) {
      const sellPrice =
        locatedSellOrderIndex >= 0
          ? currentSellOrder.price
          : currentSellOrder.price - 0.01;
      const buyPrice =
        locatedBuyOrderIndex >= 0
          ? currentBuyOrder.price
          : currentBuyOrder.price + 0.01;

      profit = getP2PProfit(
        volume,
        sellPrice,
        buyPrice,
        0.0016,
        0.0016
      ).profitPercent;

      if (profit >= minProfit) {
        arbitrageFound = true;

        if (locatedSellOrderIndex >= 0) {
          arbitrage.suggestedSellOrder = currentSellOrder;
        } else {
          arbitrage.suggestedSellOrder = {
            ...DEFAULT_SUGGESTED_SELL_ORDER,
            volume: volume,
            min: finalSellLimits[0],
            max: finalSellLimits[1],
            price: sellPrice,
          };
        }
        if (locatedBuyOrderIndex >= 0) {
          arbitrage.suggestedBuyOrder = currentBuyOrder;
        } else {
          arbitrage.suggestedBuyOrder = {
            ...DEFAULT_SUGGESTED_BUY_ORDER,
            volume: volume,
            min: finalBuyLimits[0],
            max: finalBuyLimits[1],
            price: buyPrice,
          };
        }

        arbitrage.profit = profit;
        arbitrage.sellOrderPosition = Math.max(0, sellOrderIndex + 1);
        arbitrage.buyOrderPosition = Math.max(0, buyOrderIndex + 1);
      } else if (
        !buyOrderHasReachedMaxPos &&
        (isBuyOrderTurn || sellOrderHasReachedMaxPos)
      ) {
        isBuyOrderTurn = false;
        const isBuyOrderPositionInRange =
          !maxBuyOrderPosition || buyOrderIndex < maxBuyOrderPosition;
        if (
          isBuyOrderPositionInRange &&
          buyOrderIndex + 1 < buyOrdersFiltered.length
        ) {
          buyOrderIndex++;
          currentBuyOrder = buyOrdersFiltered[buyOrderIndex];
        } else {
          buyOrderHasReachedMaxPos = true;
        }
      } else {
        isBuyOrderTurn = true;
        const isSellOrderPositionInRange =
          !maxSellOrderPosition || sellOrderIndex < maxSellOrderPosition;
        if (
          isSellOrderPositionInRange &&
          sellOrderIndex + 1 < sellOrdersFiltered.length
        ) {
          sellOrderIndex++;
          currentSellOrder = sellOrdersFiltered[sellOrderIndex];
        } else {
          sellOrderHasReachedMaxPos = true;
        }
      }
    }

    if (arbitrageFound) {
      if (locatedSellOrderIndex < 0 && arbitrage.suggestedSellOrder) {
        sellOrdersFiltered.splice(
          Math.max(0, arbitrage.sellOrderPosition - 1),
          0,
          arbitrage.suggestedSellOrder
        );
      }
      if (locatedBuyOrderIndex < 0 && arbitrage.suggestedBuyOrder) {
        buyOrdersFiltered.splice(
          Math.max(0, arbitrage.buyOrderPosition - 1),
          0,
          arbitrage.suggestedBuyOrder
        );
      }

      return {
        arbitrage,
        sellOrders: sellOrdersFiltered.slice(
          0,
          Math.max(arbitrage.sellOrderPosition, orderListMaxSize)
        ),
        buyOrders: buyOrdersFiltered.slice(
          0,
          Math.max(arbitrage.buyOrderPosition, orderListMaxSize)
        ),
      };
    }

    return {
      arbitrage: null,
      sellOrders: sellOrdersFiltered.slice(0, orderListMaxSize),
      buyOrders: buyOrdersFiltered.slice(0, orderListMaxSize),
    };
  }
}
