import { Exchange } from '../schema/exchange.schema.js'

export enum Crypocurrency {
  BTC,
  ETH,
  USDT
}

export interface IExchangeFees {
  depositFiatFee: number
  withdrawalFiatFee: number
  makerFee: number
  takerFee: number
  networkFees: { [key: string]: { [key: string]: number } }
  buyFee: number
  sellFee: number
}

export async function getExchangesFees (): Promise<{
  [exchange: string]: IExchangeFees
}> {
  try {
    const exchanges = await Exchange.find({}).exec()

    const fees = Object.fromEntries(
      exchanges?.map(exchange => [
        exchange.name.toLowerCase(),
        Object.fromEntries([
          ['depositFiatFee', exchange.depositFiatFee],
          ['withdrawalFiatFee', exchange.withdrawalFiatFee],
          ['makerFee', exchange.makerFee],
          ['takerFee', exchange.takerFee],
          [
            'networkFees',
            Object.fromEntries(
              exchange.networkFees.map(cryptoFee => [
                cryptoFee.crypto,
                Object.fromEntries(
                  cryptoFee.networks.map(network => [
                    network.network,
                    network.fee
                  ])
                )
              ])
            )
          ],
          ['buyFee', exchange.buyFee],
          ['sellFee', exchange.sellFee]
        ]) as IExchangeFees
      ])
    )

    return fees
  } catch (error) {
    return {}
  }
}
