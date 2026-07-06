import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: 'pt-PT' })
const page = await context.newPage()

await page.goto('https://vertentehub.com/conta', { waitUntil: 'networkidle' })
await page.locator('input[name="email_or_phone"]').first().fill(process.env.SUPPLIER_USER || '')
await page.locator('input[name="password"]').fill(process.env.SUPPLIER_PASS || '')
await page.locator('button[type="submit"]:not([aria-label="Pesquisar"])').first().click()
await page.waitForNavigation({ timeout: 10000 }).catch(() => {})

await page.goto('https://vertentehub.com/produtos/940', { waitUntil: 'networkidle' })

const result = await page.evaluate(() => {
  const priceEl = document.querySelector('.ml-price')
  if (!priceEl) return { found: false }

  // Get all child spans and their text
  const children = [...priceEl.querySelectorAll('*')].map(e => ({
    tag: e.tagName,
    cls: (e as HTMLElement).className,
    text: e.textContent?.trim(),
    childCount: e.children.length
  }))

  return {
    found: true,
    outerHTML: priceEl.outerHTML,
    fullText: priceEl.textContent?.trim(),
    children,
  }
})

console.log('Price element:', JSON.stringify(result, null, 2))
await browser.close()
