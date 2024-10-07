import { IExchangeFeesDTO } from '../../types/dto/index.js';
import { IExchangePricingDTO } from '../../types/dto/index.js';
import {
  CalculateP2PArbitrageParams,
  P2PArbitrageResult,
  IP2PArbitrageStrategy,
} from './p2p_strategies/types.js';
import { ExchangesFeesType } from '../../services/exchanges.service.js';
import { IPair } from '../../data/model/exchange_base.model.js';

export interface ICryptoArbitrageResult {
  crypto: string;
  fiat: string;
  askExchange: string;
  askPrice: number;
  totalAskPrice: number;
  bidExchange: string;
  bidPrice: number;
  totalBidPrice: number;
  profit: number;
  time: number;
}

export function calculateArbitragesFromPairData(
  exchangesArr: { exchange: string; value: IExchangePricingDTO }[] | undefined,
  fees: ExchangesFeesType,
  pair: IPair,
  minimumProfit = 0.8,
  includeSellBuyFees = true,
  includeDepositFiat = true,
  includeWithdrawalFiat = true
): ICryptoArbitrageResult[] {
  if (exchangesArr === undefined) return [];

  const arbitrages: ICryptoArbitrageResult[] = [];

  for (let i = 0; i < exchangesArr.length; i++) {
    const iExchangeAsk = exchangesArr[i].value.ask;
    const iExchangeBid = exchangesArr[i].value.bid;
    let iExchangeAskTotal = iExchangeAsk;
    let iExchangeBidTotal = iExchangeBid;

    const iExchangeNameFormatted = exchangesArr[i].exchange
      .toLowerCase()
      .replaceAll(' ', '')
      .replaceAll("'", '');

    const iExchangeFees = fees[iExchangeNameFormatted];

    if (iExchangeFees !== undefined && includeSellBuyFees) {
      iExchangeAskTotal = calculateTotalAsk({
        baseAsk: iExchangeAsk,
        fees: iExchangeFees,
        includeDepositFiatFee: includeDepositFiat === true,
      });
      iExchangeBidTotal = calculateTotalBid({
        baseBid: iExchangeBid,
        fees: iExchangeFees,
        includeWithdrawalFiatFee: includeWithdrawalFiat === true,
      });
    }

    for (let j = i; j < exchangesArr.length; j++) {
      const jExchangeAsk = exchangesArr[j].value.ask;
      const jExchangeBid = exchangesArr[j].value.bid;
      let jExchangeAskTotal = jExchangeAsk;
      let jExchangeBidTotal = jExchangeBid;

      const jExchangeNameFormatted = exchangesArr[j].exchange
        .toLowerCase()
        .replaceAll(' ', '')
        .replaceAll("'", '');

      const jExchangeFees = fees[jExchangeNameFormatted];

      if (jExchangeFees !== undefined && includeSellBuyFees) {
        jExchangeAskTotal = calculateTotalAsk({
          baseAsk: jExchangeAsk,
          fees: jExchangeFees,
          includeDepositFiatFee: includeDepositFiat === true,
        });
        jExchangeBidTotal = calculateTotalBid({
          baseBid: jExchangeBid,
          fees: jExchangeFees,
          includeWithdrawalFiatFee: includeWithdrawalFiat === true,
        });
      }

      let maxBidExchange = '';
      let minAskExchange = '';
      let maxBid = 0;
      let maxTotalBid = 0;
      let minAsk = 0;
      let minTotalAsk = 0;

      if (iExchangeBidTotal >= jExchangeBidTotal) {
        maxBidExchange = exchangesArr[i].exchange;
        maxBid = iExchangeBid;
        maxTotalBid = iExchangeBidTotal;
      } else {
        maxBidExchange = exchangesArr[j].exchange;
        maxBid = jExchangeBid;
        maxTotalBid = jExchangeBidTotal;
      }

      if (iExchangeAskTotal <= jExchangeAskTotal) {
        minAskExchange = exchangesArr[i].exchange;
        minAsk = iExchangeAsk;
        minTotalAsk = iExchangeAskTotal;
      } else {
        minAskExchange = exchangesArr[j].exchange;
        minAsk = jExchangeAsk;
        minTotalAsk = jExchangeAskTotal;
      }

      // Check > 0 because some exchanges can have ask price = 0 or bid price = 0
      const profit = minAsk > 0 ? (maxTotalBid / minTotalAsk - 1) * 100 : 0;

      // Before checks duplicates and profitability
      if (
        profit > 0 &&
        profit >= minimumProfit &&
        arbitrages.find(
          (arb) =>
            arb.askExchange + arb.askExchange ===
            minAskExchange + maxBidExchange
        ) === undefined
      ) {
        arbitrages.push({
          crypto: pair.crypto ?? '',
          fiat: pair.fiat ?? '',
          askExchange: minAskExchange,
          askPrice: minAsk,
          totalAskPrice: minTotalAsk,
          bidExchange: maxBidExchange,
          bidPrice: maxBid,
          totalBidPrice: maxTotalBid,
          profit: profit,
          time: Math.max(
            exchangesArr[i].value.time,
            exchangesArr[j].value.time
          ),
        });
      }
    }
  }

  return arbitrages.sort((arb1, arb2) => (arb1.profit - arb2.profit) * -1);
}

export function calculateTotalBid({
  baseBid,
  fees,
  includeWithdrawalFiatFee,
}: {
  baseBid: number;
  fees?: IExchangeFeesDTO;
  includeWithdrawalFiatFee: boolean;
}) {
  if (fees !== undefined) {
    const totalFees = includeWithdrawalFiatFee
      ? fees.sellFee + fees.withdrawalFiatFee
      : fees.sellFee;
    return baseBid * (1 - totalFees / 100);
  }
  return baseBid;
}

export function calculateTotalAsk({
  baseAsk,
  fees,
  includeDepositFiatFee,
}: {
  baseAsk: number;
  fees?: IExchangeFeesDTO;
  includeDepositFiatFee: boolean;
}) {
  if (fees !== undefined) {
    const totalFees = includeDepositFiatFee
      ? fees.buyFee + fees.depositFiatFee
      : fees.buyFee;

    return baseAsk * (1 + totalFees / 100);
  }
  return baseAsk;
}

export class ArbitrageCalculator {
  p2pArbitrageStrategy: IP2PArbitrageStrategy;

  constructor(p2pArbitrageStrategy: IP2PArbitrageStrategy) {
    this.p2pArbitrageStrategy = p2pArbitrageStrategy;
  }

  calculateP2PArbitrage(
    params: CalculateP2PArbitrageParams
  ): P2PArbitrageResult {
    return this.p2pArbitrageStrategy.calculateP2PArbitrage(params);
  }
}
