import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Save, ShoppingCart, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { auth } from '../lib/api'

const authHeaders = (): Record<string, string> => (auth.token ? { Authorization: `Bearer ${auth.token}` } : {})
const jsonHeaders = (): Record<string, string> => ({ 'Content-Type': 'application/json', ...authHeaders() })

interface Product { name: string; supplier_ref: string; cost_price: number; category?: string; brand?: string; images: string[] }
interface AmazonConfig { mode: 'FBM' | 'FBA'; referralPct: number; fbaFee: number; vatPct: number; minMarginPct: number; minRoiPct: number }
interface AmazonState { config: AmazonConfig; products: Record<string, { sellPrice?: number; sellers?: number; notes?: string }> }

interface ShippingTier { label: string; maxPrice: number; cost: number }
interface PricingState { shippingTiers: ShippingTier[]; products: Record<string, { shipping?: number }> }

function shippingFor(cost: number, tiers: ShippingTier[]): number {
  const sorted = [...tiers].sort((a, b) => (a.maxPrice || Infinity) - (b.maxPrice || Infinity))
  for (const t of sorted) if (t.maxPrice === 0 || cost <= t.maxPrice) return t.cost
  return sorted[sorted.length - 1]?.cost ?? 0
}

// Calcula o lucro real de um produto na Amazon.
// FBM: envias tu → desconta portes. FBA: Amazon → desconta taxa FBA.
function analyse(cost: number, sellPrice: number, shipping: number, c: AmazonConfig) {
  const vat = sellPrice - sellPrice / (1 + c.vatPct / 100) // IVA incluído no preço de venda
  const referral = sellPrice * (c.referralPct / 100)
  const fulfil = c.mode === 'FBA' ? c.fbaFee : shipping
  const profit = sellPrice - vat - referral - fulfil - cost
  const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0
  const roi = cost > 0 ? (profit / cost) * 100 : 0
  const worth = profit > 0 && margin >= c.minMarginPct && roi >= c.minRoiPct
  return { vat, referral, fulfil, profit, margin, roi, worth }
}

export default function AmazonPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'worth' | 'analysed'>('all')

  const { data: catalog } = useQuery<{ products: Product[] }>({
    queryKey: ['catalog'],
    queryFn: () => fetch('/api/catalog', { headers: authHeaders() }).then(r => r.json()),
  })
  const { data: amazon } = useQuery<AmazonState>({
    queryKey: ['amazon'],
    queryFn: () => fetch('/api/amazon', { headers: authHeaders() }).then(r => r.json()),
  })
  const { data: pricing } = useQuery<PricingState>({
    queryKey: ['pricing'],
    queryFn: () => fetch('/api/pricing', { headers: authHeaders() }).then(r => r.json()),
  })

  const [cfg, setCfg] = useState<AmazonConfig | null>(null)
  const config = cfg ?? amazon?.config ?? { mode: 'FBM' as const, referralPct: 15, fbaFee: 3, vatPct: 23, minMarginPct: 15, minRoiPct: 30 }

  const saveConfig = useMutation({
    mutationFn: (c: AmazonConfig) => fetch('/api/amazon/config', { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(c) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amazon'] }),
  })
  const saveProduct = useMutation({
    mutationFn: ({ ref, patch }: { ref: string; patch: any }) =>
      fetch(`/api/amazon/product/${encodeURIComponent(ref)}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(patch) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amazon'] }),
  })

  const products = catalog?.products ?? []
  const overrides = amazon?.products ?? {}

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return products
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.supplier_ref?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      .map(p => {
        const ov = overrides[p.supplier_ref] || {}
        const cost = p.cost_price || 0
        const sellPrice = ov.sellPrice ?? 0
        // portes: override do produto na página Preços, senão pela tabela de escalões
        const pOv = pricing?.products?.[p.supplier_ref]
        const shipping = pOv?.shipping != null ? pOv.shipping : shippingFor(cost, pricing?.shippingTiers ?? [])
        const a = analyse(cost, sellPrice, shipping, config)
        return { p, ov, cost, sellPrice, shipping, ...a, analysed: sellPrice > 0 }
      })
      .filter(r => filter === 'all' || (filter === 'worth' ? r.worth : r.analysed))
  }, [products, overrides, pricing, config, search, filter])

  const analysedRows = rows.filter(r => r.analysed)
  const worthCount = analysedRows.filter(r => r.worth).length
  const totalProfit = analysedRows.reduce((s, r) => s + r.profit, 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ShoppingCart size={22} /> Análise Amazon</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Define o preço-alvo de venda e vê o lucro real após taxas — e se vale a pena vender
        </p>
      </div>

      {/* Config taxas */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Taxas & critérios (estimativas ajustáveis)</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Modo:</span>
            {(['FBM', 'FBA'] as const).map(m => (
              <button key={m} onClick={() => setCfg({ ...config, mode: m })}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${config.mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {m}{m === 'FBM' ? ' (envio próprio)' : ' (Amazon)'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {([
            ['referralPct', 'Comissão Amazon %'],
            ['fbaFee', 'Taxa FBA €/un'],
            ['vatPct', 'IVA %'],
            ['minMarginPct', 'Margem mín. %'],
            ['minRoiPct', 'ROI mín. %'],
          ] as [keyof AmazonConfig, string][]).map(([key, label]) => (
            <label key={key} className="text-xs text-gray-500">
              {label}
              <input type="number" value={config[key]}
                onChange={e => setCfg({ ...config, [key]: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => saveConfig.mutate(config)} disabled={saveConfig.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save size={14} /> {saveConfig.isPending ? 'A guardar...' : 'Guardar taxas'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Analisados</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{analysedRows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Vale a pena</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{worthCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Não compensa</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{analysedRows.length - worthCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Lucro potencial</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{totalProfit.toFixed(0)} €</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar produto..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 text-xs">
          {([['all', 'Todos'], ['analysed', 'Analisados'], ['worth', 'Vale a pena']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg font-medium ${filter === v ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Produto</th>
              <th className="text-right px-3 py-2 font-medium">Custo</th>
              <th className="text-right px-3 py-2 font-medium">Preço Amazon</th>
              <th className="text-right px-3 py-2 font-medium">Portes</th>
              <th className="text-right px-3 py-2 font-medium">Taxas</th>
              <th className="text-right px-3 py-2 font-medium">Lucro</th>
              <th className="text-right px-3 py-2 font-medium">Margem</th>
              <th className="text-right px-3 py-2 font-medium">ROI</th>
              <th className="text-center px-3 py-2 font-medium">Vale a pena?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.slice(0, 300).map(({ p, cost, sellPrice, shipping, vat, referral, fulfil, profit, margin, roi, worth, analysed }, idx) => (
              <tr key={`${p.supplier_ref}-${idx}-${sellPrice}-${config.mode}`} className="hover:bg-blue-50/30">
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
                  <input type="number" step="0.01" defaultValue={sellPrice || ''} placeholder="—"
                    onBlur={e => { const v = parseFloat(e.target.value) || 0; if (v !== sellPrice) saveProduct.mutate({ ref: p.supplier_ref, patch: { sellPrice: v || '' } }) }}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-xs text-right" />
                </td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">
                  {config.mode === 'FBM' ? `${shipping.toFixed(2)} €` : <span className="text-gray-300">—</span>}
                </td>
                {analysed ? (
                  <>
                    <td className="px-3 py-2 text-right text-gray-400 text-xs" title={`IVA ${vat.toFixed(2)} + comissão ${referral.toFixed(2)} + ${config.mode === 'FBA' ? 'FBA' : 'portes'} ${fulfil.toFixed(2)}`}>
                      {(vat + referral + fulfil).toFixed(2)} €
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{profit.toFixed(2)} €</td>
                    <td className="px-3 py-2 text-right text-gray-600">{margin.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right text-gray-600">{roi.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-center">
                      {worth
                        ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 size={14} /> Sim</span>
                        : profit > 0
                          ? <span className="inline-flex items-center gap-1 text-orange-500 text-xs font-medium"><AlertTriangle size={14} /> Marginal</span>
                          : <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle size={14} /> Não</span>}
                    </td>
                  </>
                ) : (
                  <td colSpan={5} className="px-3 py-2 text-center text-gray-300 text-xs">define o preço para analisar</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 300 && <div className="text-center text-xs text-gray-400 py-3">A mostrar 300 de {rows.length} — usa a pesquisa</div>}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Cálculo ({config.mode}): Lucro = Preço Amazon − IVA − comissão Amazon − {config.mode === 'FBM' ? 'portes (envio próprio)' : 'taxa FBA'} − custo.
        Os portes vêm da tabela definida em <strong>Preços & Portes</strong>. "Vale a pena" quando margem ≥ {config.minMarginPct}% e ROI ≥ {config.minRoiPct}%.
        Ligação à conta Amazon (SP-API) para dados reais de vendas e concorrência será o próximo passo.
      </p>
    </div>
  )
}
