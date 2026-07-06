import 'dotenv/config'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'fs'
import { ScrapedProduct } from './scrapers/base.js'

const BASE = 'https://vertentehub.com'

// All known category IDs (from discovery)
const CAT_IDS = [
  28, 31, 35, 127, 147, 175, 196, 281, 282, 285, 289, 290, 291, 292, 293,
  294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308,
  309, 310, 311, 312,
]

const products: ScrapedProduct[] = JSON.parse(readFileSync('scraper-output.json', 'utf8'))
const idToCategory = new Map<number, string>()

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

console.log(`A mapear categorias para ${products.length} produtos...`)

for (const catId of CAT_IDS) {
  const url = `${BASE}/produtos?cat=${catId}`
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('main', { timeout: 8000 })

    const result = await page.evaluate(() => {
      // Get category name from page heading or breadcrumb
      const h1 = document.querySelector('main h1, main h2')
      const catName = h1 ? h1.textContent?.trim() ?? '' : ''

      // Get all product IDs listed on this page
      const ids: number[] = []
      document.querySelectorAll('main a[href^="/produtos/"]').forEach(a => {
        const m = (a as HTMLAnchorElement).href.match(/\/produtos\/(\d+)$/)
        if (m) ids.push(parseInt(m[1]))
      })

      return { catName, ids: [...new Set(ids)] }
    })

    if (result.catName && result.ids.length > 0) {
      console.log(`  cat=${catId} "${result.catName}" → ${result.ids.length} produtos`)
      result.ids.forEach(id => {
        if (!idToCategory.has(id)) idToCategory.set(id, result.catName)
      })
    } else {
      console.log(`  cat=${catId} → sem produtos`)
    }
  } catch (e) {
    console.log(`  cat=${catId} → erro: ${(e as Error).message.slice(0, 50)}`)
  }
}

await browser.close()

// Apply categories to products
let updated = 0
const fixed = products.map(p => {
  const id = parseInt(p.supplier_ref.replace('vh-', ''))
  const cat = idToCategory.get(id)
  if (cat && cat !== p.category) {
    updated++
    return { ...p, category: cat }
  }
  return p
})

writeFileSync('scraper-output.json', JSON.stringify(fixed, null, 2))
console.log(`\nConcluído! ${updated} produtos com categoria corrigida.`)

// Show final distribution
const catCount = new Map<string, number>()
fixed.forEach(p => {
  const c = p.category || 'Sem categoria'
  catCount.set(c, (catCount.get(c) ?? 0) + 1)
})
console.log('\nDistribuição final:')
;[...catCount.entries()].sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${n.toString().padStart(3)} ${c}`))
