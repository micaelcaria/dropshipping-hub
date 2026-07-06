import 'dotenv/config'
import { VertenteHubScraper } from './scrapers/vertentehub.js'
import { writeFileSync } from 'fs'

const scraper = new VertenteHubScraper({
  baseUrl: 'https://vertentehub.com',
  username: process.env.SUPPLIER_USER || '',
  password: process.env.SUPPLIER_PASS || '',
})

console.log('A iniciar scraping do Vertente Hub...')
const start = Date.now()

const products = await scraper.scrapeProducts()

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
console.log(`\nConcluído em ${elapsed}s — ${products.length} produtos encontrados`)

// Show sample
console.log('\n--- Primeiros 3 produtos ---')
products.slice(0, 3).forEach(p => {
  console.log(`\n• ${p.name}`)
  console.log(`  Ref: ${p.supplier_ref}`)
  console.log(`  Preço: ${p.cost_price}€`)
  console.log(`  EAN: ${p.attributes?.EAN || '—'}`)
  console.log(`  Imagens: ${p.images.length}`)
  console.log(`  URL: ${p.supplier_url}`)
})

// Save full results to JSON
writeFileSync('scraper-output.json', JSON.stringify(products, null, 2))
console.log(`\nResultados completos guardados em scraper-output.json`)
