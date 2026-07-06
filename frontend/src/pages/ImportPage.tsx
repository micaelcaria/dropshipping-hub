import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Wifi, WifiOff, Play, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { api } from '../lib/api'

export default function ImportPage() {
  const qc = useQueryClient()
  const [runResult, setRunResult] = useState<{ products: any[]; count: number } | null>(null)
  const [selectedAll, setSelectedAll] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [maxPages, setMaxPages] = useState(10)

  const { data: config } = useQuery({ queryKey: ['scraper-config'], queryFn: api.scraper.getConfig })

  const testMut = useMutation({ mutationFn: api.scraper.test })
  const runMut = useMutation({
    mutationFn: () => api.scraper.run(maxPages),
    onSuccess: (data) => {
      setRunResult(data)
      setSelected(new Set(data.products.map((_: any, i: number) => i)))
      setSelectedAll(true)
    },
  })
  const importMut = useMutation({
    mutationFn: () => {
      const toImport = runResult!.products.filter((_, i) => selected.has(i))
      return api.products.bulkImport(toImport)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setRunResult(null)
    },
  })

  const toggleSelect = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="p-8 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Importar do fornecedor</h2>
      <p className="text-sm text-gray-500 mb-8">Extrai produtos automaticamente do portal do fornecedor</p>

      {/* Connection status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Portal do fornecedor</h3>
            <p className="text-sm text-gray-500 mt-0.5">{config?.baseUrl || 'Não configurado — vai a Configurações'}</p>
          </div>
          <button
            onClick={() => testMut.mutate()}
            disabled={testMut.isPending || !config?.baseUrl}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            {testMut.isPending ? 'A testar...' : 'Testar ligação'}
          </button>
        </div>
        {testMut.data && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${testMut.data.connected ? 'text-green-600' : 'text-red-500'}`}>
            {testMut.data.connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {testMut.data.connected ? 'Ligação OK' : 'Falhou — verifica o URL e as credenciais'}
          </div>
        )}
      </div>

      {/* Run scraper */}
      {!runResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Extrair catálogo</h3>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Máximo de páginas</label>
              <input
                type="number" min={1} max={100}
                value={maxPages}
                onChange={e => setMaxPages(parseInt(e.target.value))}
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => runMut.mutate()}
              disabled={runMut.isPending || !config?.baseUrl}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 mt-4"
            >
              <Play size={14} />
              {runMut.isPending ? 'A extrair...' : 'Iniciar scraping'}
            </button>
          </div>
          {runMut.isPending && (
            <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              A navegar no portal e a extrair produtos... (pode demorar alguns minutos)
            </div>
          )}
          {runMut.isError && (
            <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={14} />
              {(runMut.error as Error).message}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {runResult && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Produtos encontrados: {runResult.count}</h3>
              <p className="text-sm text-gray-500">{selected.size} selecionados para importar</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRunResult(null)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                Limpar
              </button>
              <button
                onClick={() => importMut.mutate()}
                disabled={importMut.isPending || selected.size === 0}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40"
              >
                <Upload size={14} />
                {importMut.isPending ? 'A importar...' : `Importar ${selected.size} produtos`}
              </button>
            </div>
          </div>

          {importMut.isSuccess && (
            <div className="flex items-center gap-2 px-5 py-3 bg-green-50 text-green-700 text-sm">
              <CheckCircle size={14} />
              Importados com sucesso!
            </div>
          )}

          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={selectedAll}
                      onChange={e => {
                        setSelectedAll(e.target.checked)
                        setSelected(e.target.checked ? new Set(runResult.products.map((_, i) => i)) : new Set())
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ref.</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Preço custo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Categoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runResult.products.map((p, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${selected.has(i) ? '' : 'opacity-50'}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.supplier_ref}</td>
                    <td className="px-4 py-3 text-right">{p.cost_price?.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-gray-500">{p.category || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
