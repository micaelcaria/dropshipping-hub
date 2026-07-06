/**
 * Discovers ALL product IDs from vertentehub.com
 * using search queries with 1-2 char prefixes to bypass the 100-item page limit.
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const BASE = 'https://vertentehub.com'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: 'pt-PT' })
const page = await context.newPage()

// Login
await page.goto(`${BASE}/conta`, { waitUntil: 'networkidle' })
await page.locator('input[name="email_or_phone"]').first().fill(process.env.SUPPLIER_USER || '')
await page.locator('input[name="password"]').fill(process.env.SUPPLIER_PASS || '')
await page.locator('button[type="submit"]:not([aria-label="Pesquisar"])').first().click()
await page.waitForNavigation({ timeout: 10000 }).catch(() => {})
console.log('Login:', page.url())

async function getIds(url: string): Promise<Set<string>> {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  if (!res || res.status() >= 400) return new Set()
  const ids = await page.$$eval(
    'main a[href^="/produtos/"]',
    els => els.map(a => (a as HTMLAnchorElement).href.match(/\/produtos\/(\d+)$/)?.[1]).filter(Boolean) as string[]
  )
  return new Set(ids)
}

const allIds = new Set<string>()

// 1) All categories including subcategories
const catIds = [28,31,35,127,147,175,196,281,282,285,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,309,310,311,312]
process.stdout.write('Categorias: ')
for (const cat of catIds) {
  const ids = await getIds(`${BASE}/produtos?cat=${cat}`)
  ids.forEach(id => allIds.add(id))
  process.stdout.write(`${cat}(${ids.size}) `)
}
console.log(`\nApós categorias: ${allIds.size} IDs`)

// 2) Search with 1-char terms
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
process.stdout.write('Pesquisa 1-char: ')
for (const c of alphabet) {
  const ids = await getIds(`${BASE}/produtos?q=${encodeURIComponent(c)}`)
  ids.forEach(id => allIds.add(id))
  process.stdout.write(`${c}(${ids.size}) `)
}
console.log(`\nApós 1-char: ${allIds.size} IDs`)

// 3) Search with 2-char combos for vowels (most common in Portuguese)
// Focus on combinations likely to yield < 100 results
const vowels = 'aeiou'
const consonants = 'bcdfghjklmnpqrstvwxyz'
const prefixes2: string[] = []
// vowel + any letter
for (const v of vowels) for (const c of alphabet) prefixes2.push(v+c)
// consonant + vowel
for (const c of consonants) for (const v of vowels) prefixes2.push(c+v)

process.stdout.write('Pesquisa 2-char: ')
let batch2 = 0
for (const p of prefixes2) {
  const ids = await getIds(`${BASE}/produtos?q=${encodeURIComponent(p)}`)
  const before = allIds.size
  ids.forEach(id => allIds.add(id))
  if (allIds.size > before) {
    process.stdout.write(`+${allIds.size - before}(${p}) `)
  }
  batch2++
  if (batch2 % 50 === 0) process.stdout.write(`[${allIds.size}]`)
}
console.log(`\nApós 2-char: ${allIds.size} IDs únicos`)

// Save all discovered IDs
const sorted = [...allIds].map(Number).sort((a, b) => a - b)
writeFileSync('discovered-ids.json', JSON.stringify(sorted, null, 2))
console.log(`\nSalvo em discovered-ids.json — ${sorted.length} IDs`)
console.log(`Range: ${sorted[0]} → ${sorted[sorted.length-1]}`)

await browser.close()
