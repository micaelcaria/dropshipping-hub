import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const router = Router()
const __dir = dirname(fileURLToPath(import.meta.url))
const PRICING_FILE = join(__dir, '../../pricing.json')

export interface ShippingTier {
  label: string
  maxPrice: number // aplica-se quando o custo do produto é <= maxPrice (0 = sem limite / topo)
  cost: number
}

export interface PricingState {
  global: {
    marginPct: number   // margem sobre o custo
    ivaPct: number      // IVA a aplicar (PT = 23)
    freeShippingAbove: number // portes grátis acima deste PVP (0 = nunca)
  }
  shippingTiers: ShippingTier[]
  // overrides por supplier_ref: margem e/ou preço de venda manual (s/IVA)
  products: Record<string, { marginPct?: number; sellPrice?: number; shipping?: number; ignore?: boolean }>
}

const DEFAULT_STATE: PricingState = {
  global: { marginPct: 40, ivaPct: 23, freeShippingAbove: 0 },
  shippingTiers: [
    { label: 'Pequeno', maxPrice: 15, cost: 3.5 },
    { label: 'Médio', maxPrice: 50, cost: 5.5 },
    { label: 'Grande', maxPrice: 0, cost: 8.9 },
  ],
  products: {},
}

function load(): PricingState {
  if (!existsSync(PRICING_FILE)) return DEFAULT_STATE
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(readFileSync(PRICING_FILE, 'utf8')) }
  } catch {
    return DEFAULT_STATE
  }
}

function save(state: PricingState) {
  writeFileSync(PRICING_FILE, JSON.stringify(state, null, 2))
}

router.get('/', (_req, res) => {
  res.json(load())
})

// Atualizar config global + tabela de portes
router.put('/', (req, res) => {
  const state = load()
  const { global, shippingTiers } = req.body || {}
  if (global) state.global = { ...state.global, ...global }
  if (Array.isArray(shippingTiers)) state.shippingTiers = shippingTiers
  save(state)
  res.json(state)
})

// Override de um produto (margem, preço manual, portes, ignorar)
router.put('/product/:ref', (req, res) => {
  const state = load()
  const ref = req.params.ref
  const patch = req.body || {}
  const current = state.products[ref] || {}
  const next = { ...current, ...patch }
  // limpar campos vazios/undefined
  Object.keys(next).forEach(k => {
    const v = (next as any)[k]
    if (v === null || v === undefined || v === '') delete (next as any)[k]
  })
  if (Object.keys(next).length === 0) delete state.products[ref]
  else state.products[ref] = next
  save(state)
  res.json(state.products[ref] || {})
})

export default router
