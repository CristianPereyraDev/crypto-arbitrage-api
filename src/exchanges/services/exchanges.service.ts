import { IExchangePricingDTO } from '../../data/dto/index.js';
import {
  IP2POrder,
  IP2PPairOrders,
  P2POrderType,
} from '../../data/model/exchange_p2p.model.js';
import {
  ExchangeType,
  IExchangeBase,
  IPair,
} from '../../data/model/exchange_base.model.js';
import { IExchangeRepository } from '../../repository/exchange-repository.js';
import { IBrokerageRepository } from '../../repository/brokerage-repository.js';
import { IExchangeP2PRepository } from '../../repository/exchange-p2p-repository.js';
import { IExchangeFeesDTO } from '../../data/dto/index.js';
import { ExchangeBaseRepository } from '../../repository/exchange-base-repository.js';
import { IExchangePairPrices } from '../../data/model/exchange.model.js';
import { IBrokeragePairPrices } from '../../data/model/brokerage.model.js';
import {
  calculateTotalAsk,
  calculateTotalBid,
} from '../../arbitrages/arbitrage-calculator.js';

export type ExchangesFeesType = { [exchange: string]: IExchangeFeesDTO };

export class ExchangeService {
  constructor(
    private readonly exchangeBaseRepository: ExchangeBaseRepository<IExchangeBase>,
    private readonly exchangeRepository: IExchangeRepository,
    private readonly brokerageRepository: IBrokerageRepository,
    private readonly exchangeP2PRepository: IExchangeP2PRepository
  ) {}

  async getP2POrders(
    exchangeSlug: string,
    pair: IPair
  ): Promise<IP2PPairOrders> {
    return await this.exchangeP2PRepository.getP2POrders(exchangeSlug, pair);
  }

  async updateP2POrders(
    exchangeSlugName: string,
    baseAsset: string,
    fiat: string,
    sellOrders: IP2POrder[],
    buyOrders: IP2POrder[]
  ) {
    this.exchangeP2PRepository.updateP2POrders(
      exchangeSlugName,
      baseAsset,
      fiat,
      sellOrders,
      buyOrders
    );
  }

  async updateBrokeragePrices(
    brokerageSlugName: string,
    prices: IBrokeragePairPrices[]
  ) {
    this.brokerageRepository.updatePrices(brokerageSlugName, prices);
  }

  async updateExchangePrices(
    exchangeSlugName: string,
    prices: IExchangePairPrices[]
  ) {
    this.exchangeRepository.updatePrices(exchangeSlugName, prices);
  }

  async getAvailablePairs(): Promise<IPair[]> {
    const exchangesPairs =
      await this.exchangeBaseRepository.getAllAvailablePairs();

    return exchangesPairs;
  }

  async getAllExchangesPricesBySymbol(
    asset: string,
    fiat: string,
    volume = 1.0
  ): Promise<IExchangePricingDTO[]> {
    const prices = await Promise.all([
      this.brokerageRepository.getAllPricesByPair({ crypto: asset, fiat }, 1),
      this.exchangeRepository.getAllPricesByPair(
        { crypto: asset, fiat },
        volume
      ),
      this.exchangeP2PRepository.getAllPricesByPair(
        { crypto: asset, fiat },
        volume
      ),
    ]);

    return prices.flat();
  }

  async getPricesWithFees(asset: string, fiat: string, volume = 1.0) {
    const prices = await this.getAllExchangesPricesBySymbol(
      asset,
      fiat,
      volume
    );
    const fees = await this.getAllFees();
    const pricesWithFees = fees
      ? prices.map((price) => {
          const exchangeFees =
            fees[price.exchangeSlug.replaceAll(' ', '').toLocaleLowerCase()];

          if (exchangeFees !== undefined) {
            return {
              ...price,
              totalAsk: calculateTotalAsk({
                baseAsk: price.ask,
                fees: exchangeFees,
                includeDepositFiatFee: false,
              }),
              totalBid: calculateTotalBid({
                baseBid: price.bid,
                fees: exchangeFees,
                includeWithdrawalFiatFee: false,
              }),
            };
          }
          return price;
        })
      : prices;

    return pricesWithFees;
  }

  async getAvailableExchanges() {
    return this.exchangeBaseRepository.getAllExchanges(
      [],
      ExchangeType.Exchange,
      true
    );
  }

  async getAvailableBrokerages() {
    return this.exchangeBaseRepository.getAllExchanges(
      [],
      ExchangeType.Brokerage,
      true
    );
  }

  async getAvailableP2PExchanges() {
    return this.exchangeBaseRepository.getAllExchanges(
      [],
      ExchangeType.P2PExchange,
      true
    );
  }

  async getAllAvailableExchangesList() {
    return this.exchangeBaseRepository.getAllExchanges(
      [
        'name',
        'slug',
        'availablePairs',
        'logoURL',
        'networkFees',
        'depositFiatFee',
        'withdrawalFiatFee',
        'makerFee',
        'takerFee',
        'buyFee',
        'sellFee',
        'exchangeType',
      ],
      undefined,
      true
    );
  }

  async getAllAvailableExchanges(): Promise<Map<string, IExchangeBase>> {
    const exchanges = await this.getAllAvailableExchangesList();

    return new Map<string, IExchangeBase>(
      exchanges.map((exchange) => [exchange.slug, { ...exchange }])
    );
  }

  async getAllFees() {
    const allFees: ExchangesFeesType = {};
    const feesArray = await Promise.all([
      this.exchangeBaseRepository.getExchangesFees(),
    ]);

    for (const exchangeFees of feesArray) {
      Object.assign(allFees, exchangeFees);
    }

    return allFees;
  }
}
