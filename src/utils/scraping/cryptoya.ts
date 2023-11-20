import * as cheerio from 'cheerio'

export async function performScraping (): Promise<{ [pair: string]: any }> {
  try {
    const response = await fetch('https://criptoya.com/', {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      }
    })
    const responseText = await response.text()

    const $ = cheerio.load(responseText, null, false)

    const exchangesMapping: { [pair: string]: any } = {}

    $('table').each((i, element) => {
      if (element.attribs.id !== undefined) {
        const coin = element.attribs['data-coin']
        const fiat = element.attribs['data-fiat']

        const idMapping: { [exchange: string]: number } = {}

        $(element)
          .find('tbody tr')
          .each((i, element) => {
            const exchangeId = element.attribs.class?.trim().slice(2)
            const exchangeName = $(element).find('th').get(0)?.attribs[
              'data-order'
            ]

            if (exchangeName !== undefined)
              idMapping[exchangeName] = Number(exchangeId)
          })

        exchangesMapping[coin + fiat] = idMapping
      }
    })

    return exchangesMapping
  } catch (error) {
    console.log(error)
    return new Map<string, any>()
  }
}
