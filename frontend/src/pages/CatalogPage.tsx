import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Package, Store, ExternalLink } from 'lucide-react'
import { api, Product, Marketplace } from '../lib/api'

const MARKETPLACES: Marketplace[] = ['olx', 'vinted', 'wallapop', 'amazon', 'fnac', 'temu']

export default function CatalogPage() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)
  const qc = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search, sourceFilter],
    queryFn: () => api.products.list({ ...(search && { search }), ...(sourceFilter && { source: sourceFilter }) }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.products.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catálogo</h2>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} produtos</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Adicionar produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="supplier">Fornecedor</option>
          <option value="own">Próprios</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">A carregar...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum produto ainda. Importa do fornecedor ou adiciona manualmente.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Produto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Origem</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Custo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Preços</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300">
                          <Package size={16} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                        {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.source === 'own' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {product.source === 'own' ? <Store size={10} /> : <Package size={10} />}
                      {product.source === 'own' ? 'Próprio' : 'Fornecedor'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{product.cost_price.toFixed(2)} €</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {MARKETPLACES.filter(m => product.marketplace_prices?.[m]).map(m => (
                        <span key={m} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {m} {product.marketplace_prices[m]?.toFixed(0)}€
                        </span>
                      ))}
                      {!Object.values(product.marketplace_prices || {}).some(Boolean) && (
                        <span className="text-gray-400 text-xs">Sem preços</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {product.stock > 0 ? product.stock : 'Sem stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {product.supplier_url && (
                        <a href={product.supplier_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button onClick={() => setEditing(product)} className="text-gray-400 hover:text-blue-600">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => confirm('Eliminar produto?') && deleteMut.mutate(product.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(adding || editing) && (
        <ProductModal
          product={editing}
          onClose={() => { setAdding(false); setEditing(null) }}
          onSaved={() => { setAdding(false); setEditing(null); qc.invalidateQueries({ queryKey: ['products'] }) }}
        />
      )}
    </div>
  )
}

function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !product
  const [form, setForm] = useState<Partial<Product>>(product ?? {
    source: 'own',
    cost_price: 0,
    stock: 0,
    images: [],
    marketplace_prices: {},
    attributes: {},
    active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (isNew) await api.products.create(form)
      else await api.products.update(product!.id, form)
      onSaved()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{isNew ? 'Adicionar produto' : 'Editar produto'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input value={form.name || ''} onChange={e => set('name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <select value={form.source || 'own'} onChange={e => set('source', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="own">Próprio (das minhas instalações)</option>
                <option value="supplier">Fornecedor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de custo (€) *</label>
              <input type="number" step="0.01" value={form.cost_price ?? 0} onChange={e => set('cost_price', parseFloat(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input value={form.sku || ''} onChange={e => set('sku', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input value={form.brand || ''} onChange={e => set('brand', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input value={form.category || ''} onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input type="number" value={form.stock ?? 0} onChange={e => set('stock', parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagens (URLs, uma por linha)</label>
              <textarea rows={2} value={(form.images || []).join('\n')} onChange={e => set('images', e.target.value.split('\n').filter(Boolean))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preços por marketplace (€)</h4>
            <div className="grid grid-cols-3 gap-3">
              {MARKETPLACES.map(m => (
                <div key={m}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{m}</label>
                  <input
                    type="number" step="0.01"
                    value={form.marketplace_prices?.[m] ?? ''}
                    onChange={e => set('marketplace_prices', { ...form.marketplace_prices, [m]: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder={`${((form.cost_price || 0) * 1.4).toFixed(2)}`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
