import 'dotenv/config'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'fs'
import { ScrapedProduct } from './scrapers/base.js'

const BASE_URL = 'https://vertentehub.com'
const USERNAME = process.env.SUPPLIER_USER || ''
const PASSWORD = process.env.SUPPLIER_PASS || ''

const allIds: number[] = JSON.parse(readFileSync('all-ids.json', 'utf8'))
const existing: ScrapedProduct[] = JSON.parse(readFileSync('scraper-output.json', 'utf8'))

const scrapedIds = new Set(existing.map(p => parseInt(p.supplier_ref.replace('vh-', ''))))
const missingIds = allIds.filter(id => !scrapedIds.has(id))
console.log(`Já temos ${existing.length} produtos. Vamos buscar ${missingIds.length} em falta...`)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

// Login
await page.goto(`${BASE_URL}/conta`, { waitUntil: 'domcontentloaded' })
await page.fill('input[name="email_or_phone"], input[type="text"], input[type="email"]', USERNAME)
await page.fill('input[type="password"]', PASSWORD)
await page.click('button[type="submit"]:not([aria-label="Pesquisar"])')
try { await page.waitForNavigation({ timeout: 8000 }) } catch {}
const loggedIn = await page.$('a[href*="/conta"], a[href*="logout"], a[href*="sair"]')
console.log(loggedIn ? 'Login OK' : 'Login falhou — continuando sem login')

// Scrape each missing product page
const newProducts: ScrapedProduct[] = []
for (let i = 0; i < missingIds.length; i++) {
  const id = missingIds[i]
  const url = `${BASE_URL}/produtos/${id}`
  process.stdout.write(`\r [${i + 1}/${missingIds.length}] id=${id}   `)
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('main h1, main h2', { timeout: 10000 })

    const product = await page.evaluate(([id, base]) => {
      // Name
      const nameEl = document.querySelector('main h1') || document.querySelector('main h2')
      const name = nameEl ? nameEl.textContent?.trim() ?? '' : ''
      if (!name) return null

      // Price
      const mlPrice = document.querySelector('.ml-price')
      let cost_price = 0
      if (mlPrice) {
        const centsEl = mlPrice.querySelector('.ml-price-cents')
        const cents = centsEl ? centsEl.textContent?.trim() ?? '' : ''
        let intPart = ''
        mlPrice.childNodes.forEach(n => { if (n.nodeType === 3) intPart += (n.textContent ?? '').trim() })
        const intNum = intPart.replace(/[^\d]/g, '')
        if (intNum) cost_price = parseFloat(`${intNum}.${cents || '00'}`)
      }

      // EAN
      let ean = ''
      document.querySelectorAll('p, span, td, li').forEach(el => {
        if (!ean && el.textContent?.includes('EAN:')) {
          el.childNodes.forEach(n => {
            if (!ean && n.nodeType === 3) {
              const t = (n.textContent ?? '').trim()
              if (t && !/EAN/.test(t)) ean = t
            }
          })
          if (!ean && el.nextElementSibling) ean = el.nextElementSibling.textContent?.trim() ?? ''
        }
      })

      // Description
      let description = ''
      document.querySelectorAll('h2, h3, p').forEach(el => {
        if (!description && /descri[cç][aã]o/i.test(el.textContent ?? '')) {
          if (el.nextElementSibling) description = el.nextElementSibling.textContent?.trim() ?? ''
        }
      })

      // Images
      const imgArr: string[] = []
      const imgSeen = new Set<string>()
      document.querySelectorAll('img').forEach(img => {
        const src = (img as HTMLImageElement).src || img.getAttribute('src') || ''
        if (src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !imgSeen.has(src)) {
          imgSeen.add(src); imgArr.push(src)
        }
      })

      // Category from breadcrumb
      let category = ''
      document.querySelectorAll('nav a, a').forEach(a => {
        const href = (a as HTMLAnchorElement).href ?? ''
        if (href.includes('?cat=') || href.includes('/produtos?')) {
          const t = a.textContent?.trim() ?? ''
          if (t && t.toLowerCase() !== 'produtos' && t.toLowerCase() !== 'início') category = t
        }
      })

      // Brand from name prefix
      const brandMatch = name.match(/^([A-Z0-9][A-Z0-9\s]{1,20}?)\s*[-–]\s*/i)
      const brand = brandMatch ? brandMatch[1].trim() : ''

      return {
        name,
        supplier_ref: `vh-${id}`,
        description,
        cost_price,
        images: imgArr,
        category: category || 'Sem categoria',
        brand,
        supplier_url: `${base}/produtos/${id}`,
        attributes: { EAN: ean }
      }
    }, [id, BASE_URL] as [number, string])

    if (product) newProducts.push(product)
  } catch (e) {
    console.error(`\n  Erro em id=${id}: ${(e as Error).message.slice(0, 60)}`)
  }
}

await browser.close()

const merged = [...existing, ...newProducts]
writeFileSync('scraper-output.json', JSON.stringify(merged, null, 2))
console.log(`\n\nConcluído! ${newProducts.length} novos produtos adicionados.`)
console.log(`Total agora: ${merged.length} produtos em scraper-output.json`)
