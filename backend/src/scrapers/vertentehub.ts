import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { BaseScraper, ScrapedProduct } from './base.js'

const BASE = 'https://vertentehub.com'

const CATEGORIES = [
  28, 31, 35, 127, 147, 175, 196, 281, 282, 285, 302, 312,
]

export class VertenteHubScraper extends BaseScraper {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private loggedIn = false

  async testConnection(): Promise<boolean> {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      const res = await page.goto(BASE, { timeout: 15000 })
      return (res?.status() ?? 0) < 400
    } catch {
      return false
    } finally {
      await browser.close()
    }
  }

  async scrapeProducts(_maxPages?: number): Promise<ScrapedProduct[]> {
    this.browser = await chromium.launch({ headless: true })
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'pt-PT',
    })

    try {
      if (this.config.username && this.config.password) {
        await this.login().catch(e => console.warn('Login error:', e.message))
      }

      const productUrls = await this.collectAllProductUrls()
      console.log(`\nTotal: ${productUrls.size} URLs únicas — a fazer scraping...`)

      const products: ScrapedProduct[] = []
      const page = await this.context!.newPage()

      let i = 0
      for (const url of productUrls) {
        i++
        process.stdout.write(`\r  [${i}/${productUrls.size}] ${url.split('/').pop()}   `)
        try {
          const product = await this.scrapeProductPage(page, url)
          if (product) products.push(product)
        } catch (e: any) {
          // silently skip failed pages
        }
      }

      process.stdout.write('\n')
      await page.close()
      return products
    } finally {
      await this.browser.close()
    }
  }

  private async login(): Promise<void> {
    const page = await this.context!.newPage()
    await page.goto(`${BASE}/conta`, { waitUntil: 'networkidle', timeout: 30000 })

    // Fill email — placeholder is "E-mail ou telefone"
    const emailInput = page.locator('input[type="text"], input[type="email"]').first()
    await emailInput.waitFor({ timeout: 10000 })
    await emailInput.fill(this.config.username!)

    // Fill password
    const passInput = page.locator('input[type="password"]').first()
    await passInput.fill(this.config.password!)

    // Click "Continuar" — the login submit button (not the search bar submit)
    const submitBtn = page.locator('button[type="submit"]:not([aria-label="Pesquisar"])').first()
    await submitBtn.click()

    // Wait for navigation away from /conta login page
    try {
      await page.waitForURL(url => !url.toString().includes('/conta') || url.toString().includes('?next'), { timeout: 10000 })
      this.loggedIn = true
      console.log('Login bem-sucedido:', page.url())
    } catch {
      // Try alternative: check if user menu appeared
      const loggedInIndicator = await page.locator('[href*="/logout"], [href*="/sair"], [class*="avatar"]').count()
      this.loggedIn = loggedInIndicator > 0
      console.log(`Login ${this.loggedIn ? 'OK' : 'falhou'} — URL: ${page.url()}`)
    }

    await page.close()
  }

  private async collectAllProductUrls(): Promise<Set<string>> {
    const urls = new Set<string>()
    const page = await this.context!.newPage()

    await this.extractUrlsFromPage(page, `${BASE}/produtos`, urls)
    for (const catId of CATEGORIES) {
      await this.extractUrlsFromPage(page, `${BASE}/produtos?cat=${catId}`, urls)
    }

    await page.close()
    return urls
  }

  private async extractUrlsFromPage(page: Page, url: string, urls: Set<string>): Promise<void> {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      // Wait for product cards to appear
      await page.waitForSelector('main a[href^="/produtos/"]', { timeout: 10000 }).catch(() => {})

      const links = await page.$$eval(
        'main a[href^="/produtos/"]',
        els => els.map(a => (a as HTMLAnchorElement).href).filter(h => /\/produtos\/\d+$/.test(h))
      )
      links.forEach(l => urls.add(l))
      console.log(`${url.replace(BASE, '')}: ${links.length} produtos (total: ${urls.size})`)
    } catch (e: any) {
      console.warn(`Erro em ${url}: ${e.message}`)
    }
  }

  private async scrapeProductPage(page: Page, url: string): Promise<ScrapedProduct | null> {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Wait for the main heading to be rendered by React
    await page.waitForSelector('main h1, main h2', { timeout: 10000 })

    const data = await page.evaluate(() => {
      const main = document.querySelector('main')
      if (!main) return null

      const name = (main.querySelector('h1') || main.querySelector('h2'))?.textContent?.trim() || ''
      if (!name) return null

      // EAN — find "EAN:" label, next sibling text node
      const allLeaves = [...main.querySelectorAll('*')].filter(e => e.children.length === 0)
      const eanIdx = allLeaves.findIndex(e => e.textContent?.trim() === 'EAN:')
      const ean = eanIdx >= 0 ? allLeaves[eanIdx + 1]?.textContent?.trim() : undefined

      // Description — text after "Descrição" heading
      const allHeadings = [...main.querySelectorAll('h1,h2,h3,h4')]
      const descH = allHeadings.find(h => h.textContent?.trim() === 'Descrição')
      const description = descH?.nextElementSibling?.textContent?.trim() || undefined

      // Price — <p class="ml-price">€ </span>INTEGER<span class="ml-price-cents">CENTS</span></p>
      let price = 0
      const mlPrice = main.querySelector('.ml-price')
      if (mlPrice) {
        const centsEl = mlPrice.querySelector('.ml-price-cents')
        const cents = centsEl?.textContent?.trim() || '00'
        // Integer is in a direct text node (not in a span)
        let integerText = ''
        mlPrice.childNodes.forEach(node => {
          if (node.nodeType === 3) integerText += node.textContent?.trim() // text nodes only
        })
        integerText = integerText.replace(/[^\d]/g, '')
        if (integerText) {
          price = parseFloat(`${integerText}.${cents}`) || 0
        }
      }

      // Images — unique, CDN only
      const imgs = [...new Set(
        [...main.querySelectorAll('img')]
          .map(i => (i as HTMLImageElement).src)
          .filter(s => s?.startsWith('http') && !s.includes('data:'))
      )]

      // Brand — "BRAND - Product Name" pattern (all caps before dash)
      const brandMatch = name.match(/^([A-ZÇÃÂÁÀÉÊÓÔÕÚ][A-ZÇÃÂÁÀÉÊÓÔÕÚ0-9\s]{1,20}?)\s*[-–]\s*/)
      const brand = brandMatch?.[1]?.trim() || undefined

      // Category from breadcrumb nav (skip "Início" and "Produtos")
      const breadLinks = [...document.querySelectorAll('nav a')]
      const catLink = breadLinks.find(a => {
        const href = a.getAttribute('href') || ''
        return href.includes('?cat=')
      })
      const category = catLink?.textContent?.trim() || undefined

      // Supplier ref from URL
      const idMatch = location.href.match(/\/produtos\/(\d+)/)
      const supplierRef = idMatch ? `vh-${idMatch[1]}` : undefined

      return { name, ean, description, price, imgs, brand, category, supplierRef }
    })

    if (!data || !data.name) return null

    return {
      name: data.name,
      supplier_ref: data.supplierRef ?? `vh-${Date.now()}`,
      description: data.description,
      cost_price: data.price,
      images: data.imgs,
      brand: data.brand,
      category: data.category,
      supplier_url: url,
      attributes: data.ean ? { EAN: data.ean } : {},
    }
  }
}
