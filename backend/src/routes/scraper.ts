import { Router } from 'express'
import type { BaseScraper } from '../scrapers/base.js'

const router = Router()

let scraperConfig = {
  baseUrl: process.env.SUPPLIER_URL || 'https://vertentehub.com',
  username: process.env.SUPPLIER_USER || '',
  password: process.env.SUPPLIER_PASS || '',
  selectors: {} as Record<string, string>,
}

// Playwright é pesado e só está instalado em dev — carregar sob demanda
async function getScraper(): Promise<BaseScraper> {
  if (scraperConfig.baseUrl.includes('vertentehub.com')) {
    const { VertenteHubScraper } = await import('../scrapers/vertentehub.js')
    return new VertenteHubScraper(scraperConfig)
  }
  const { GenericScraper } = await import('../scrapers/generic.js')
  return new GenericScraper(scraperConfig)
}

router.get('/config', (_req, res) => {
  res.json({
    baseUrl: scraperConfig.baseUrl,
    username: scraperConfig.username ? '***' : '',
    hasPassword: !!scraperConfig.password,
    selectors: scraperConfig.selectors,
    scraperType: scraperConfig.baseUrl.includes('vertentehub.com') ? 'VertenteHub (dedicado)' : 'Genérico',
  })
})

router.post('/config', (req, res) => {
  const { baseUrl, username, password, selectors } = req.body
  if (baseUrl) scraperConfig.baseUrl = baseUrl
  if (username) scraperConfig.username = username
  if (password) scraperConfig.password = password
  if (selectors) scraperConfig.selectors = { ...scraperConfig.selectors, ...selectors }
  res.json({ ok: true })
})

router.post('/test', async (_req, res) => {
  if (!scraperConfig.baseUrl) return res.status(400).json({ error: 'No supplier URL configured' })
  const ok = await (await getScraper()).testConnection()
  res.json({ connected: ok, url: scraperConfig.baseUrl })
})

router.post('/run', async (req, res) => {
  if (!scraperConfig.baseUrl) return res.status(400).json({ error: 'No supplier URL configured' })
  const maxPages = parseInt(req.body.maxPages) || 10
  try {
    const products = await (await getScraper()).scrapeProducts(maxPages)
    res.json({ products, count: products.length })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
