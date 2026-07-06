import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../supabase.js'

const router = Router()

const ProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  cost_price: z.number().min(0),
  images: z.array(z.string()).default([]),
  category: z.string().optional(),
  brand: z.string().optional(),
  weight_kg: z.number().optional(),
  stock: z.number().int().default(0),
  source: z.enum(['supplier', 'own']).default('supplier'),
  supplier_url: z.string().optional(),
  supplier_ref: z.string().optional(),
  attributes: z.record(z.string()).default({}),
  marketplace_prices: z.object({
    olx: z.number().optional(),
    vinted: z.number().optional(),
    wallapop: z.number().optional(),
    amazon: z.number().optional(),
    fnac: z.number().optional(),
    temu: z.number().optional(),
  }).default({}),
  active: z.boolean().default(true),
})

// List products
router.get('/', async (req, res) => {
  const { search, category, source, active } = req.query
  let query = supabase.from('products').select('*').order('created_at', { ascending: false })

  if (search) query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category', category)
  if (source) query = query.eq('source', source)
  if (active !== undefined) query = query.eq('active', active === 'true')

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Get single product
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Not found' })
  res.json(data)
})

// Create product
router.post('/', async (req, res) => {
  const parsed = ProductSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase.from('products').insert(parsed.data).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// Update product
router.patch('/:id', async (req, res) => {
  const parsed = ProductSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase.from('products').update(parsed.data).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Delete product
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('products').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

// Bulk import (from scraper)
router.post('/bulk', async (req, res) => {
  const { products } = req.body as { products: unknown[] }
  if (!Array.isArray(products)) return res.status(400).json({ error: 'products must be array' })

  const valid = products.map(p => ProductSchema.safeParse(p)).filter(r => r.success).map(r => (r as any).data)

  const { data, error } = await supabase.from('products').upsert(valid, { onConflict: 'supplier_ref' }).select()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ imported: data?.length ?? 0, skipped: products.length - (data?.length ?? 0) })
})

export default router
