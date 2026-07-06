import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Save, Truck, Percent, Package } from 'lucide-react'
import { auth } from '../lib/api'

const authHeaders = (): Record<string, string> => (auth.token ? { Authorization: `Bearer ${auth.token}` } : {})
const jsonHeaders = (): Record<string, string> => ({ 'Content-Type': 'application/json', ...authHeaders() })

interface Product {
  name: string
  supplier_ref: string
  cost_price: number
  category?: string
  brand?: string
  stock?: string
  images: string[]
}

interface ShippingTier { label: string; maxPrice: number; cost: number }
interface PricingState {
  global: { marginPct: number; ivaPct: number; freeShippingAbove: number }
  shippingTiers: ShippingTier[]
  products: Record<string, { marginPct?: number; sellPrice?: number; shipping?: number; ignore?: boolean }>
}

function shippingFor(cost: number, tiers: ShippingTier[]): number {
  const sorted = [...tiers].sort((a, b) => (a.maxPrice || Infinity) - (b.maxPrice || Infinity))
  for (const t of sorted) {
    if (t.maxPrice === 0 || cost <= t.maxPrice) return t.cost
  }
  return sorted[sorted.length - 1]?.cost ?? 0
}

export default function PricingPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: catalog } = useQuery<{ products: Product[] }>({
    queryKey: ['catalog'],
    queryFn: () => fetch('/api/catalog', { headers: authHeaders() }).then(r => r.json()),
  })
  const { data: pricing } = useQuery<PricingState>({
    queryKey: ['pricing'],
    queryFn: () => fetch('/api/pricing', { headers: authHeaders() }).then(r => r.json()),
  })

  const products = catalog?.products ?? []

  // Estado local editável da config global
  const [g, setG] = useState({ marginPct: 40, ivaPct: 23, freeShippingAbove: 0 })
  const [tiers, setTiers] = useState<ShippingTier[]>([])
  useEffect(() => {
    if (pricing) {
      setG(pricing.global)
      setTiers(pricing.shippingTiers)
    }
  }, [pricing])

  const saveGlobal = useMutation({
    mutationFn: () => fetch('/api/pricing', {
      method: 'PUT', headers: jsonHeaders(),
      body: JSON.stringify({ global: g, shippingTiers: tiers }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  })

  const saveProduct = useMutation({
    mutationFn: ({ ref, patch }: { ref: string; patch: any }) =>
      fetch(`/api/pricing/product/${encodeURIComponent(ref)}`, {
        method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(patch),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  })

  const overrides = pricing?.products ?? {}

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    // usar sempre os dados carregados do servidor para o cálculo (evita atraso do estado local)
    const calcTiers = pricing?.shippingTiers ?? []
    const gg = pricing?.global ?? g
    return products
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.supplier_ref?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      .map(p => {
        const ov = overrides[p.supplier_ref] || {}
        const cost = p.cost_price || 0
        const marginPct = ov.marginPct ?? gg.marginPct
        // preço de venda s/IVA: manual (sellPrice) ou custo + margem
        const sellNoVat = ov.sellPrice != null ? ov.sellPrice : cost * (1 + marginPct / 100)
        const pvp = sellNoVat * (1 + gg.ivaPct / 100)
        const shipping = ov.shipping != null ? ov.shipping : shippingFor(cost, calcTiers)
        const profit = sellNoVat - cost // lucro s/IVA (o IVA é entregue ao estado)
        const realMargin = cost > 0 ? (profit / cost) * 100 : 0
        return { p, ov, cost, marginPct, sellNoVat, pvp, shipping, profit, realMargin }
      })
  }, [products, overrides, pricing, g, search])

  const totalProfit = rows.reduce((s, r) => s + (r.ov.ignore ? 0 : r.profit), 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Preços & Portes</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Define margem, IVA e portes para preparar os produtos para a loja manutinstal.pt
        </p>
      </div>

      {/* Config global */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Percent size={15} /> Margem & IVA (aplicado a todos, salvo override)</h3>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs text-gray-500">
                Margem %
                <input type="number" value={g.marginPct}
                  onChange={e => setG({ ...g, marginPct: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
              </label>
              <label className="text-xs text-gray-500">
                IVA %
                <input type="number" value={g.ivaPct}
                  onChange={e => setG({ ...g, ivaPct: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
              </label>
              <label className="text-xs text-gray-500">
                Portes grátis &gt; PVP €
                <input type="number" value={g.freeShippingAbove}
                  onChange={e => setG({ ...g, freeShippingAbove: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Truck size={15} /> Tabela de portes (por custo do produto)</h3>
            <div className="space-y-2">
              {tiers.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <input value={t.label} onChange={e => { const n = [...tiers]; n[i] = { ...t, label: e.target.value }; setTiers(n) }}
                    className="w-24 px-2 py-1 border border-gray-200 rounded text-xs" />
                  <span className="text-xs text-gray-400">custo ≤</span>
                  <input type="number" value={t.maxPrice} onChange={e => { const n = [...tiers]; n[i] = { ...t, maxPrice: parseFloat(e.target.value) || 0 }; setTiers(n) }}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" placeholder="0=∞" />
                  <span className="text-xs text-gray-400">€ → portes</span>
                  <input type="number" step="0.1" value={t.cost} onChange={e => { const n = [...tiers]; n[i] = { ...t, cost: parseFloat(e.target.value) || 0 }; setTiers(n) }}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" />
                  <span className="text-xs text-gray-400">€</span>
                  <button onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                </div>
              ))}
              <button onClick={() => setTiers([...tiers, { label: 'Novo', maxPrice: 0, cost: 0 }])}
                className="text-xs text-blue-600 hover:underline">+ adicionar escalão</button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => saveGlobal.mutate()} disabled={saveGlobal.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save size={14} /> {saveGlobal.isPending ? 'A guardar...' : 'Guardar config'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Produtos</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{rows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Lucro potencial total (s/IVA)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalProfit.toFixed(0)} €</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Margem média</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {rows.length ? (rows.reduce((s, r) => s + r.realMargin, 0) / rows.length).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar produto..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Produto</th>
              <th className="text-right px-3 py-2 font-medium">Custo s/IVA</th>
              <th className="text-right px-3 py-2 font-medium">Margem %</th>
              <th className="text-right px-3 py-2 font-medium">Venda s/IVA</th>
              <th className="text-right px-3 py-2 font-medium">PVP c/IVA</th>
              <th className="text-right px-3 py-2 font-medium">Portes</th>
              <th className="text-right px-3 py-2 font-medium">Lucro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.slice(0, 300).map(({ p, ov, cost, marginPct, sellNoVat, pvp, shipping, profit }, idx) => (
              <tr key={`${p.supplier_ref}-${idx}-${marginPct}-${sellNoVat.toFixed(2)}-${shipping.toFixed(2)}`} className={`hover:bg-blue-50/30 ${ov.ignore ? 'opacity-40' : ''}`}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-8 h-8 rounded object-cover bg-gray-100" /> : <div className="w-8 h-8 rounded bg-gray-100" />}
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-1 max-w-xs">{p.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.supplier_ref}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{cost.toFixed(2)} €</td>
                <td className="px-3 py-2 text-right">
                  <input type="number" defaultValue={marginPct}
                    onBlur={e => { const v = parseFloat(e.target.value); if (v !== marginPct) saveProduct.mutate({ ref: p.supplier_ref, patch: { marginPct: v, sellPrice: '' } }) }}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-right" />
                </td>
                <td className="px-3 py-2 text-right">
                  <input type="number" step="0.01" defaultValue={sellNoVat.toFixed(2)}
                    onBlur={e => { const v = parseFloat(e.target.value); if (Math.abs(v - sellNoVat) > 0.001) saveProduct.mutate({ ref: p.supplier_ref, patch: { sellPrice: v } }) }}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-xs text-right" />
                </td>
                <td className="px-3 py-2 text-right font-semibold text-gray-900">{pvp.toFixed(2)} €</td>
                <td className="px-3 py-2 text-right">
                  <input type="number" step="0.1" defaultValue={shipping.toFixed(2)}
                    onBlur={e => { const v = parseFloat(e.target.value); if (Math.abs(v - shipping) > 0.001) saveProduct.mutate({ ref: p.supplier_ref, patch: { shipping: v } }) }}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-right" />
                </td>
                <td className="px-3 py-2 text-right font-semibold text-green-600">{profit.toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 300 && <div className="text-center text-xs text-gray-400 py-3">A mostrar 300 de {rows.length} — usa a pesquisa para filtrar</div>}
      </div>
    </div>
  )
}
