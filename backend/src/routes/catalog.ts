import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { syncFromSheet, getLastSync } from '../sync.js'

const router = Router()
const __dir = dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = join(__dir, '../../scraper-output.json')

// Serve scraped catalog directly from JSON (pre-Supabase)
router.get('/', (_req, res) => {
  if (!existsSync(OUTPUT_FILE)) {
    return res.json({ products: [], total: 0, message: 'Scraper ainda não foi executado' })
  }
  const products = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'))
  res.json({ products, total: products.length, lastSync: getLastSync() })
})

// Trigger manual sync from the Google Sheet
router.post('/sync', async (_req, res) => {
  const result = await syncFromSheet()
  res.status(result.ok ? 200 : 502).json(result)
})

// Last sync info
router.get('/sync', (_req, res) => {
  res.json(getLastSync() ?? { message: 'Nunca sincronizado' })
})

export default router
