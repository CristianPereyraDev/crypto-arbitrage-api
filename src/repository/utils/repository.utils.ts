import { IExchangeFeesDTO } from '../../types/dto/index.js';
import { IExchangeBase } from '../../data/model/exchange_base.model.js';

export function exchangeFeesToDTO(exchange: IExchangeBase): IExchangeFeesDTO {
  return Object.fromEntries([
    ['depositFiatFee', exchange.depositFiatFee],
    ['withdrawalFiatFee', exchange.withdrawalFiatFee],
    ['makerFee', exchange.makerFee],
    ['takerFee', exchange.takerFee],
    [
      'networkFees',
      Object.fromEntries(
        exchange.networkFees.map((cryptoFee) => [
          cryptoFee.crypto,
          Object.fromEntries(
            cryptoFee.networks.map((network) => [network.network, network.fee])
          ),
        ])
      ),
    ],
    ['buyFee', exchange.buyFee],
    ['sellFee', exchange.sellFee],
  ]);
}
