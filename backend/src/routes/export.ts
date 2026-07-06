import { Router } from 'express'
import { supabase } from '../supabase.js'
import { exportForMarketplace } from '../exporters/index.js'

const router = Router()
const MARKETPLACES = ['olx', 'vinted', 'wallapop', 'amazon', 'fnac', 'temu'] as const

// Export CSV for a marketplace
router.get('/:marketplace/csv', async (req, res) => {
  const marketplace = req.params.marketplace as typeof MARKETPLACES[number]
  if (!MARKETPLACES.includes(marketplace)) return res.status(400).json({ error: 'Invalid marketplace' })

  const ids = req.query.ids ? String(req.query.ids).split(',') : null
  let query = supabase.from('products').select('*').eq('active', true)
  if (ids) query = query.in('id', ids)

  const { data: products, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const rows = products.map(p => exportForMarketplace(p, marketplace))
  if (!rows.length) return res.status(404).json({ error: 'No products found' })

  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(';'),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${marketplace}_export_${Date.now()}.csv"`)
  res.send('﻿' + csv) // BOM for Excel compatibility
})

// Preview export for single product
router.get('/:marketplace/preview/:productId', async (req, res) => {
  const marketplace = req.params.marketplace as typeof MARKETPLACES[number]
  if (!MARKETPLACES.includes(marketplace)) return res.status(400).json({ error: 'Invalid marketplace' })

  const { data: product, error } = await supabase.from('products').select('*').eq('id', req.params.productId).single()
  if (error) return res.status(404).json({ error: 'Product not found' })

  res.json(exportForMarketplace(product, marketplace))
})

export default router
