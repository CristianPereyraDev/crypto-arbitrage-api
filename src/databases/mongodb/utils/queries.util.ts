import { Exchange } from '../schema/exchange.schema.js'

export enum Crypocurrency {
  BTC,
  ETH,
  USDT
}

export interface IExchangeFees {
  makerFee: number
  takerFee: number
  networkFees: { [key: string]: { [key: string]: number } }
}

export async function getExchangesFees (): Promise<{
  [k: string]: IExchangeFees
}> {
  try {
    const exchanges = await Exchange.find({}).exec()

    const fees = Object.fromEntries(
      exchanges?.map(exchange => [
        exchange.name,
        Object.fromEntries([
          ['makerFee', exchange.makerFee],
          ['takerFee', exchange.takerFee],
          [
            'networkFees',
            Object.fromEntries(
              exchange.fees.map(cryptoFee => [
                cryptoFee.crypto,
                Object.fromEntries(
                  cryptoFee.networks.map(network => [
                    network.network,
                    network.fee
                  ])
                )
              ])
            )
          ]
        ]) as IExchangeFees
      ])
    )

    return fees
  } catch (error) {
    return {}
  }
}
