import { Exchange } from '../schema/exchange.schema.js'

export enum Crypocurrency {
  BTC,
  ETH,
  USDT
}

export interface IExchangeFees {
  makerFee: number
  takerFee: number
  networkFees: Map<string, Map<string, number>>
}

export async function getExchangesFees (): Promise<
  Map<string, IExchangeFees> | undefined
> {
  try {
    const result = new Map<string, IExchangeFees>()
    const exchanges = await Exchange.find({}).exec()

    for (let exchange of exchanges) {
      const exchangeFees: IExchangeFees = {
        makerFee: exchange.makerFee,
        takerFee: exchange.takerFee,
        networkFees: new Map(
          exchange.fees.map(elem => [
            elem.crypto,
            new Map(elem.networks.map(elem => [elem.network, elem.fee]))
          ])
        )
      }
      result.set(exchange.name, exchangeFees)
    }

    return result
  } catch (error) {
    return undefined
  }
}
