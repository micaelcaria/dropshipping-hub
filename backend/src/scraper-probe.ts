/**
 * Check product count after proper login and explore admin panel
 */
import { chromium } from 'playwright'

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
const loginUrl = page.url()
console.log('Login URL:', loginUrl)

// Check if logged in
const isLoggedIn = !loginUrl.includes('/conta') || loginUrl.includes('?next')
console.log('Logged in:', isLoggedIn)

// Check conta page for user info
const accountText = await page.evaluate(() => document.querySelector('main')?.textContent?.slice(0, 500))
console.log('Account page:', accountText?.slice(0, 200))

// Try admin
await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 15000 })
console.log('Admin URL:', page.url())
const adminText = await page.evaluate(() => document.querySelector('main')?.textContent?.slice(0, 300))
console.log('Admin content:', adminText)

// Check product count when logged in
await page.goto(`${BASE}/produtos`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('main a[href^="/produtos/"]', { timeout: 10000 }).catch(() => {})
const count = await page.$$eval('main a[href^="/produtos/"]', els => els.length)
const totalText = await page.evaluate(() => document.querySelector('main')?.textContent?.match(/\([\d ]+produtos?\)/i)?.[0])
console.log(`\nProdutos após login: ${count} cartas, texto total: ${totalText}`)

// Check cat=312 (Marcas, 100 items) - does it show more when logged in?
await page.goto(`${BASE}/produtos?cat=312`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('main a[href^="/produtos/"]', { timeout: 10000 }).catch(() => {})
const cat312Count = await page.$$eval('main a[href^="/produtos/"]', els => els.length)
const cat312Total = await page.evaluate(() => document.querySelector('main')?.textContent?.match(/\([\d ]+produtos?\)/i)?.[0])
console.log(`cat=312 após login: ${cat312Count} cards, total: ${cat312Total}`)

await browser.close()
