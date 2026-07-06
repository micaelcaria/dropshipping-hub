import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Eye } from 'lucide-react'
import { api, Marketplace, Product } from '../lib/api'

const MARKETPLACES: { id: Marketplace; label: string; color: string; description: string }[] = [
  { id: 'olx', label: 'OLX', color: 'orange', description: 'CSV para import manual ou referência' },
  { id: 'vinted', label: 'Vinted', color: 'teal', description: 'Formato com categorias Vinted' },
  { id: 'wallapop', label: 'Wallapop', color: 'red', description: 'Formato Wallapop' },
  { id: 'amazon', label: 'Amazon', color: 'yellow', description: 'Flat File para Seller Central' },
  { id: 'fnac', label: 'Fnac', color: 'blue', description: 'CSV para Marketplace Fnac' },
  { id: 'temu', label: 'Temu', color: 'purple', description: 'Formato Temu Seller' },
]

export default function ExportPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<{ marketplace: Marketplace; product: Product } | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, string | number> | null>(null)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list({ active: 'true' }),
  })

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const showPreview = async (marketplace: Marketplace, product: Product) => {
    setPreview({ marketplace, product })
    const data = await api.export.preview(marketplace, product.id)
    setPreviewData(data)
  }

  const downloadCsv = (marketplace: Marketplace) => {
    const ids = selected.size > 0 ? [...selected] : undefined
    window.open(api.export.csvUrl(marketplace, ids), '_blank')
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Exportar</h2>
      <p className="text-sm text-gray-500 mb-8">Gera ficheiros CSV formatados para cada marketplace</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {MARKETPLACES.map(({ id, label, description }) => (
          <div key={id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{label}</h3>
              <span className="text-xs text-gray-400">{products.length} produtos</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">{description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => downloadCsv(id)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700"
              >
                <Download size={12} />
                {selected.size > 0 ? `${selected.size} selecionados` : 'Todos'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product list with per-product preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Selecionar produtos específicos</h3>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-900">
              Limpar seleção
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left w-8">
                <input type="checkbox"
                  checked={selected.size === products.length && products.length > 0}
                  onChange={e => setSelected(e.target.checked ? new Set(products.map(p => p.id)) : new Set())}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Produto</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Origem</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Pré-visualizar como</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleSelect(product.id)} />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${product.source === 'own' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                    {product.source === 'own' ? 'Próprio' : 'Fornecedor'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {MARKETPLACES.map(({ id, label }) => (
                      <button key={id} onClick={() => showPreview(id, product)}
                        className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-200 rounded hover:border-blue-400 hover:text-blue-600">
                        <Eye size={10} /> {label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Sem produtos. Importa primeiro no catálogo.</div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {preview.product.name} → {preview.marketplace.toUpperCase()}
              </h3>
              <button onClick={() => { setPreview(null); setPreviewData(null) }} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6">
              {!previewData ? (
                <div className="text-center text-gray-400 py-8">A carregar...</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(previewData).map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">{k}</td>
                        <td className="py-2 text-gray-900 break-words">{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
