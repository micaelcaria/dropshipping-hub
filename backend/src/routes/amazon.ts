import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const router = Router()
const __dir = dirname(fileURLToPath(import.meta.url))
const FILE = join(__dir, '../../amazon.json')

export interface AmazonState {
  // taxas globais (estimativas — ajustáveis)
  config: {
    mode: 'FBM' | 'FBA' // FBM = envias tu (desconta portes); FBA = Amazon (desconta taxa FBA)
    referralPct: number  // comissão Amazon (referral fee), tipicamente 15%
    fbaFee: number       // taxa FBA por unidade (só usada em modo FBA)
    vatPct: number       // IVA do marketplace (PT/ES 23/21, usa o do país de venda)
    minMarginPct: number // margem mínima para "vale a pena"
    minRoiPct: number    // ROI mínimo para "vale a pena"
  }
  // por supplier_ref: preço-alvo de venda na Amazon (c/IVA) + dados de concorrência
  products: Record<string, { sellPrice?: number; sellers?: number; notes?: string }>
}

const DEFAULT: AmazonState = {
  config: { mode: 'FBM', referralPct: 15, fbaFee: 3.0, vatPct: 23, minMarginPct: 15, minRoiPct: 30 },
  products: {},
}

function load(): AmazonState {
  if (!existsSync(FILE)) return DEFAULT
  try {
    const d = JSON.parse(readFileSync(FILE, 'utf8'))
    return { config: { ...DEFAULT.config, ...d.config }, products: d.products || {} }
  } catch { return DEFAULT }
}
function save(s: AmazonState) { writeFileSync(FILE, JSON.stringify(s, null, 2)) }

router.get('/', (_req, res) => res.json(load()))

router.put('/config', (req, res) => {
  const s = load()
  s.config = { ...s.config, ...(req.body || {}) }
  save(s)
  res.json(s.config)
})

router.put('/product/:ref', (req, res) => {
  const s = load()
  const ref = req.params.ref
  const next = { ...(s.products[ref] || {}), ...(req.body || {}) }
  Object.keys(next).forEach(k => {
    const v = (next as any)[k]
    if (v === null || v === undefined || v === '') delete (next as any)[k]
  })
  if (Object.keys(next).length === 0) delete s.products[ref]
  else s.products[ref] = next
  save(s)
  res.json(s.products[ref] || {})
})

export default router
