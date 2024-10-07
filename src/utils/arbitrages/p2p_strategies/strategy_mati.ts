import { IP2POrder } from '../../../data/model/exchange_p2p.model.js';
import {
  DEFAULT_ARBITRAGE,
  DEFAULT_SUGGESTED_BUY_ORDER,
  DEFAULT_SUGGESTED_SELL_ORDER,
  calculateP2PProfit,
  getUserOrders,
} from './strategy_basic.js';
import {
  CalculateP2PArbitrageParams,
  IP2PArbitrageStrategy,
  P2PArbitrage,
  P2PArbitrageResult,
} from './types.js';

export class MatiStrategy implements IP2PArbitrageStrategy {
  calculateP2PArbitrage(
    params: CalculateP2PArbitrageParams
  ): P2PArbitrageResult {
    const {
      sellOrders,
      buyOrders,
      userType,
      nickName,
      volume,
      minProfit,
      maxSellOrderPosition,
      maxBuyOrderPosition,
    } = params;

    const arbitrage: P2PArbitrage = DEFAULT_ARBITRAGE;
    const orderListMaxSize = Number(
      process.env.P2P_ARBITRAGE_RESPONSE_ORDER_LIST_SIZE ?? 20
    );

    const userBuyOrders = getUserOrders(buyOrders, nickName);
    const userSellOrders = getUserOrders(sellOrders, nickName);

    const buyLimits =
      userBuyOrders.length > 0
        ? [userBuyOrders[0].min, userBuyOrders[0].max]
        : params.buyLimits;
    const sellLimits =
      userSellOrders.length > 0
        ? [userSellOrders[0].min, userSellOrders[0].max]
        : params.sellLimits;

    const buyConditions = [
      (order: IP2POrder) => order.userType === userType,
      (order: IP2POrder) =>
        buyLimits[0] >= order.min && buyLimits[0] <= order.max,
    ];
    const sellConditions = [
      (order: IP2POrder) => order.userType === userType,
      (order: IP2POrder) =>
        sellLimits[0] >= order.min && sellLimits[0] <= order.max,
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
          profit: calculateP2PProfit(
            sellOrdersFiltered[locatedSellOrderIndex].price,
            buyOrdersFiltered[locatedBuyOrderIndex].price
          ),
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

      profit = calculateP2PProfit(sellPrice, buyPrice);

      if (profit >= minProfit) {
        arbitrageFound = true;

        if (locatedSellOrderIndex >= 0) {
          arbitrage.suggestedSellOrder = currentSellOrder;
        } else {
          arbitrage.suggestedSellOrder = {
            ...DEFAULT_SUGGESTED_SELL_ORDER,
            volume: volume,
            min: sellLimits[0],
            max: sellLimits[1],
            price: sellPrice,
          };
        }
        if (locatedBuyOrderIndex >= 0) {
          arbitrage.suggestedBuyOrder = currentBuyOrder;
        } else {
          arbitrage.suggestedBuyOrder = {
            ...DEFAULT_SUGGESTED_BUY_ORDER,
            volume: volume,
            min: buyLimits[0],
            max: buyLimits[1],
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
