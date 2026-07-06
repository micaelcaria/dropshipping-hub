import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Search, Package, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react'

interface ScrapedProduct {
  name: string
  supplier_ref: string
  description?: string
  cost_price: number
  images: string[]
  category?: string
  brand?: string
  stock?: string
  supplier_url: string
  attributes?: { EAN?: string }
}

interface SyncInfo {
  ok: boolean
  total: number
  added: string[]
  removed: string[]
  stockChanges: { ref: string; name: string; before: string; after: string }[]
  priceChanges: { ref: string; name: string; before: number; after: number }[]
  syncedAt: string
  error?: string
}

export default function ComparePage() {
  const [search, setSearch] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['all']))
  const [showMissingPrice, setShowMissingPrice] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<{ products: ScrapedProduct[]; total: number; lastSync?: SyncInfo }>({
    queryKey: ['catalog'],
    queryFn: () => fetch('/api/catalog').then(r => r.json()),
  })

  const syncMutation = useMutation({
    mutationFn: () => fetch('/api/catalog/sync', { method: 'POST' }).then(r => r.json()) as Promise<SyncInfo>,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
  })

  const products = data?.products ?? []

  const filtered = useMemo(() => {
    let list = products
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.supplier_ref?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.attributes?.EAN?.includes(q)
      )
    }
    if (showMissingPrice) list = list.filter(p => !p.cost_price)
    return list
  }, [products, search, showMissingPrice])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, ScrapedProduct[]>()
    filtered.forEach(p => {
      const cat = p.category || 'Sem categoria'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    })
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const withPrice = products.filter(p => p.cost_price > 0).length
  const withStock = products.filter(p => p.stock && !/indispon|esgotado|0/i.test(p.stock)).length
  const lastSync = data?.lastSync
  const syncResult = syncMutation.data

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const expandAll = () => setExpandedCats(new Set(grouped.map(([cat]) => cat)))
  const collapseAll = () => setExpandedCats(new Set())

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catálogo Vertente Hub</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Sincronizado da folha de stock do fornecedor (atualizada 2x/dia)
            {lastSync?.syncedAt && (
              <span className="ml-2 text-gray-400">
                · última sync: {new Date(lastSync.syncedAt).toLocaleString('pt-PT')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={syncMutation.isPending ? 'animate-spin' : ''} />
          {syncMutation.isPending ? 'A sincronizar...' : 'Sincronizar agora'}
        </button>
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${syncResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {syncResult.ok ? (
            <>
              <strong>Sincronizado:</strong> {syncResult.total} produtos
              {syncResult.added.length > 0 && <> · <strong>{syncResult.added.length} novos</strong></>}
              {syncResult.removed.length > 0 && <> · <strong>{syncResult.removed.length} removidos</strong></>}
              {syncResult.stockChanges.length > 0 && <> · <strong>{syncResult.stockChanges.length} alterações de stock</strong></>}
              {syncResult.priceChanges.length > 0 && <> · <strong>{syncResult.priceChanges.length} alterações de preço</strong></>}
              {syncResult.added.length === 0 && syncResult.removed.length === 0 &&
                syncResult.stockChanges.length === 0 && syncResult.priceChanges.length === 0 && <> · sem alterações</>}
              {syncResult.stockChanges.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs">
                  {syncResult.stockChanges.slice(0, 10).map(c => (
                    <li key={c.ref}>• {c.name.slice(0, 60)}: <span className="line-through opacity-60">{c.before}</span> → <strong>{c.after}</strong></li>
                  ))}
                  {syncResult.stockChanges.length > 10 && <li>… e mais {syncResult.stockChanges.length - 10}</li>}
                </ul>
              )}
            </>
          ) : (
            <><strong>Erro na sincronização:</strong> {syncResult.error}</>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de produtos', value: products.length, color: 'blue' },
          { label: 'Com stock', value: withStock, color: 'green' },
          { label: 'Com preço', value: withPrice, color: 'orange' },
          { label: 'Categorias', value: grouped.length, color: 'purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar nome, ref, EAN, marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showMissingPrice} onChange={e => setShowMissingPrice(e.target.checked)} />
          Só sem preço
        </label>
        <div className="ml-auto flex gap-2 text-xs">
          <button onClick={expandAll} className="text-blue-600 hover:underline">Expandir tudo</button>
          <span className="text-gray-300">|</span>
          <button onClick={collapseAll} className="text-blue-600 hover:underline">Colapsar tudo</button>
        </div>
      </div>

      {isLoading && <div className="text-center py-16 text-gray-400">A carregar...</div>}

      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl p-4 mb-4">
          <AlertCircle size={16} />
          Backend não está a correr. Inicia o servidor backend primeiro.
        </div>
      )}

      {!isLoading && products.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>Scraper ainda não foi executado. Vai a <strong>Importar</strong> para extrair o catálogo.</p>
        </div>
      )}

      {/* Grouped product list */}
      <div className="space-y-3">
        {grouped.map(([cat, prods]) => {
          const isOpen = expandedCats.has(cat)
          return (
            <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{cat}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{prods.length} produtos</span>
                  <span className="text-xs text-green-600">{prods.filter(p => p.cost_price > 0).length} com preço</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {/* Products table */}
              {isOpen && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs w-12"></th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Produto</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Ref</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">EAN</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Marca</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Preço custo</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-500 text-xs">Stock</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-500 text-xs">Imgs</th>
                        <th className="px-4 py-2 text-xs"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {prods.map(p => (
                        <tr key={p.supplier_ref} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-2">
                            {p.images[0]
                              ? <img src={p.images[0]} alt="" className="w-9 h-9 rounded object-cover bg-gray-100" />
                              : <div className="w-9 h-9 rounded bg-gray-100" />
                            }
                          </td>
                          <td className="px-4 py-2">
                            <span className="font-medium text-gray-900 line-clamp-1 max-w-xs block">{p.name}</span>
                          </td>
                          <td className="px-4 py-2 text-gray-500 font-mono text-xs">{p.supplier_ref}</td>
                          <td className="px-4 py-2 text-gray-400 font-mono text-xs">{p.attributes?.EAN || '—'}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{p.brand || '—'}</td>
                          <td className="px-4 py-2 text-right">
                            {p.cost_price > 0
                              ? <span className="font-semibold text-gray-900">{p.cost_price.toFixed(2)} €</span>
                              : <span className="text-orange-400 text-xs">sem preço</span>
                            }
                          </td>
                          <td className="px-4 py-2 text-center">
                            {p.stock ? (
                              /indispon|esgotado/i.test(p.stock)
                                ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">{p.stock}</span>
                                : <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">{p.stock}</span>
                            ) : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-400 text-xs">{p.images.length}</td>
                          <td className="px-4 py-2">
                            {p.supplier_url && (
                              <a
                                href={p.supplier_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-300 hover:text-blue-500 transition-colors"
                                title="Ver no Vertente Hub"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
