const BASE = '/api'

const TOKEN_KEY = 'drophub_token'
export const auth = {
  get token() { return localStorage.getItem(TOKEN_KEY) },
  set(token: string) { localStorage.setItem(TOKEN_KEY, token) },
  clear() { localStorage.removeItem(TOKEN_KEY) },
  async login(email: string, password: string) {
    const res = await fetch(BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha no login' }))
      throw new Error(err.error || 'Falha no login')
    }
    const data = await res.json()
    auth.set(data.token)
    return data
  },
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = auth.token
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })
  if (res.status === 401) {
    auth.clear()
    window.location.reload()
    throw new Error('Sessão expirada')
  }
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
      const params = new URLSearchParams()
      if (ids) params.set('ids', ids.join(','))
      if (auth.token) params.set('token', auth.token)
      const qs = params.toString()
      return `${BASE}/export/${marketplace}/csv${qs ? '?' + qs : ''}`
    },
    preview: (marketplace: Marketplace, productId: string) =>
      req<Record<string, string | number>>(`/export/${marketplace}/preview/${productId}`),
  },
}
