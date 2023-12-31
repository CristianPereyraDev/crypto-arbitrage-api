import * as cheerio from 'cheerio'

export async function performScraping (): Promise<{
  [symbol: string]: {
    ids: { [id: string]: string }
    coin: string
    fiat: string
  }
} | null> {
  try {
    const response = await fetch('https://criptoya.com/', {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    const responseText = await response.text()

    console.log(responseText)

    const $ = cheerio.load(responseText, null, false)

    const exchangesMapping: {
      [symbol: string]: {
        ids: { [id: string]: string }
        coin: string
        fiat: string
      }
    } = {}

    $('table').each((i, element) => {
      if (element.attribs.id !== undefined) {
        const coin = element.attribs['data-coin']
        const fiat = element.attribs['data-fiat']

        const idToExchangeMapping: { [id: string]: string } = {}

        $(element)
          .find('tbody tr')
          .each((i, element) => {
            const exchangeId = element.attribs.class?.trim().slice(2)
            const exchangeName = $(element).find('th').get(0)?.attribs[
              'data-order'
            ]

            if (exchangeName !== undefined)
              idToExchangeMapping[exchangeId] = exchangeName
          })

        exchangesMapping[coin + fiat] = { ids: idToExchangeMapping, coin, fiat }
      }
    })

    return exchangesMapping
  } catch (error) {
    return null
  }
}
