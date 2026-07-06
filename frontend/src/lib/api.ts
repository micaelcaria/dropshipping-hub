const BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export type Marketplace = 'olx' | 'vinted' | 'wallapop' | 'amazon' | 'fnac' | 'temu'

export interface Product {
  id: string
  name: string
  sku?: string
  description?: string
  cost_price: number
  images: string[]
  category?: string
  brand?: string
  weight_kg?: number
  stock: number
  source: 'supplier' | 'own'
  supplier_url?: string
  supplier_ref?: string
  attributes: Record<string, string>
  marketplace_prices: Partial<Record<Marketplace, number>>
  active: boolean
  created_at: string
  updated_at: string
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>

// Products
export const api = {
  products: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req<Product[]>(`/products${qs}`)
    },
    get: (id: string) => req<Product>(`/products/${id}`),
    create: (data: Partial<ProductInput>) => req<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ProductInput>) => req<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/products/${id}`, { method: 'DELETE' }),
    bulkImport: (products: Partial<ProductInput>[]) => req<{ imported: number; skipped: number }>('/products/bulk', { method: 'POST', body: JSON.stringify({ products }) }),
  },
  scraper: {
    getConfig: () => req<{ baseUrl: string; username: string; hasPassword: boolean; selectors: Record<string, string> }>('/scraper/config'),
    setConfig: (config: { baseUrl?: string; username?: string; password?: string; selectors?: Record<string, string> }) =>
      req('/scraper/config', { method: 'POST', body: JSON.stringify(config) }),
    test: () => req<{ connected: boolean; url: string }>('/scraper/test', { method: 'POST' }),
    run: (maxPages?: number) => req<{ products: Partial<ProductInput>[]; count: number }>('/scraper/run', { method: 'POST', body: JSON.stringify({ maxPages }) }),
  },
  export: {
    csvUrl: (marketplace: Marketplace, ids?: string[]) => {
      const qs = ids ? `?ids=${ids.join(',')}` : ''
      return `${BASE}/export/${marketplace}/csv${qs}`
    },
    preview: (marketplace: Marketplace, productId: string) =>
      req<Record<string, string | number>>(`/export/${marketplace}/preview/${productId}`),
  },
}
