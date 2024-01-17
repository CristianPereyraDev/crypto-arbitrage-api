import { ICurrencyRate } from 'src/databases/mongodb/model/currency_pair.model.js'
import { CurrencyPair } from 'src/databases/mongodb/schema/currency_pair.schema.js'

export async function updateCurrencyPairRate (
  currencyBase: string,
  currencyQuote: string,
  newRates: ICurrencyRate[]
) {
  try {
    await CurrencyPair.findOneAndUpdate(
      {
        base: currencyBase,
        quote: currencyQuote
      },
      {
        $set: { rates: newRates }
      },
      {
        upsert: true
      }
    )
  } catch (error) {
    console.log('Can not update the mongodb document: %s', error)
  }
}

export async function getCurrencyPairRates (
  currencyBase: string,
  currencyQuote: string
) {
  try {
    const currencyPair = await CurrencyPair.findOne({
      base: currencyBase,
      quote: currencyQuote
    })

    if (currencyPair) {
      return currencyPair.rates
    }
  } catch (error) {
    console.log(
      'An error has ocurred while finding currency pair rates: %s',
      error
    )
  }
}
