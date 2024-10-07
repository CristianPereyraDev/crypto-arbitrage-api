import { IExchangeP2PRepository } from '../repository/exchange-p2p-repository.js';
import { IP2PArbitrageStrategy } from '../utils/arbitrages/p2p_strategies/types.js';

export class CalculateP2PArbitrage {
  strategy: IP2PArbitrageStrategy;
  repository: IExchangeP2PRepository;

  constructor(
    p2pArbitrageStrategy: IP2PArbitrageStrategy,
    p2pRepository: IExchangeP2PRepository
  ) {
    this.strategy = p2pArbitrageStrategy;
    this.repository = p2pRepository;
  }
}
