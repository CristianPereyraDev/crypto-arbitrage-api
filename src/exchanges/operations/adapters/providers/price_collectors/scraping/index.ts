import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

import {
  IP2POrder,
  P2POrderType,
  P2PUserType,
} from '../../../../../../data/model/exchange_p2p.model.js';
import { ScrapingError } from 'src/types/errors/index.js';

export async function performStaticScraping(): Promise<IP2POrder[]> {
  try {
    const response = await fetch(
      'https://www.bitget.com/es/p2p-trade/sell/USDC?fiatName=ARS',
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );
    const responseText = await response.text();

    return scrapData(responseText);
  } catch (error) {
    return [];
  }
}

export async function performDynamicScraping(
  asset: string,
  fiat: string,
  tradeType: P2POrderType,
  publisherType: P2PUserType | null
): Promise<IP2POrder[]> {
  try {
    // Start a Puppeteer session with:
    const browser = await puppeteer.launch({
      headless: true,
    });

    // Open a new page
    const page = await browser.newPage();

    // Enable request interception
    await page.setRequestInterception(true);

    // Intercept requests and block certain resource types
    page.on('request', (req) => {
      if (['image', 'font'].indexOf(req.resourceType()) > -1) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(
      `https://www.bitget.com/es/p2p-trade/sell/${asset}?fiatName=${fiat}`
    );
    console.log('Dynamic Page loaded');
    await page.waitForSelector('.payment', { timeout: 5000 });

    const htmlContent = await page.content();

    const orders = scrapData(htmlContent);

    await page.close();
    await browser.close();

    return orders;
  } catch (error) {
    throw new ScrapingError(`${asset}-${fiat}`, 'Bitget', 'unknown');
  }
}

function scrapData(content: string) {
  const $ = cheerio.load(content, null, false);

  const orders: IP2POrder[] = [];

  $('div#hall-publish-list_item-box .hall-list > .hall-list-item').each(
    (i, element) => {
      const nick = $(element).find('.list-item__nickname').first().text();
      const price = $(element)
        .find('.price-shower')
        .first()
        .text()
        .trim()
        .split(' ')[0];
      const volume = $(element)
        .find('.list_limit')
        .find('span')
        .eq(2)
        .text()
        .trim()
        .split(' ')[0];
      const limits = $(element)
        .find('.list_limit')
        .find('span')
        .eq(3)
        .text()
        .trim()
        .split(' ')[0];
      const payments = $(element)
        .find('.list-payment')
        .find('span.payment')
        .map((i, el) => {
          const payment = $(el).find('img, em').first();
          const attr = payment.attr();
          return attr ? attr.alt : payment.text().trim();
        })
        .toArray();

      console.log(nick.trim(), price.trim(), volume, limits, payments);

      orders.push({
        orderType: P2POrderType.SELL,
        orderId: '',
        volume: Number(volume),
        price: Number(price),
        min: Number(limits.split('-')[0]),
        max: Number(limits.split('-')[1]),
        payments: payments.map((p) => ({ slug: p, name: p })),
        userType: P2PUserType.merchant,
        merchantId: '',
        merchantName: nick,
        monthOrderCount: 0,
        monthFinishRate: 0,
        positiveRate: 0,
        link: '',
      });
    }
  );

  return orders;
}

//performStaticScraping();
performDynamicScraping('USDT', 'ARS', P2POrderType.BUY, P2PUserType.merchant);
