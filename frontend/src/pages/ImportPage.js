import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wifi, WifiOff, Play, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { api } from '../lib/api';
export default function ImportPage() {
    const qc = useQueryClient();
    const [runResult, setRunResult] = useState(null);
    const [selectedAll, setSelectedAll] = useState(true);
    const [selected, setSelected] = useState(new Set());
    const [maxPages, setMaxPages] = useState(10);
    const { data: config } = useQuery({ queryKey: ['scraper-config'], queryFn: api.scraper.getConfig });
    const testMut = useMutation({ mutationFn: api.scraper.test });
    const runMut = useMutation({
        mutationFn: () => api.scraper.run(maxPages),
        onSuccess: (data) => {
            setRunResult(data);
            setSelected(new Set(data.products.map((_, i) => i)));
            setSelectedAll(true);
        },
    });
    const importMut = useMutation({
        mutationFn: () => {
            const toImport = runResult.products.filter((_, i) => selected.has(i));
            return api.products.bulkImport(toImport);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['products'] });
            setRunResult(null);
        },
    });
    const toggleSelect = (i) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };
    return (_jsxs("div", { className: "p-8 max-w-4xl", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-1", children: "Importar do fornecedor" }), _jsx("p", { className: "text-sm text-gray-500 mb-8", children: "Extrai produtos automaticamente do portal do fornecedor" }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-5 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Portal do fornecedor" }), _jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: config?.baseUrl || 'Não configurado — vai a Configurações' })] }), _jsx("button", { onClick: () => testMut.mutate(), disabled: testMut.isPending || !config?.baseUrl, className: "flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40", children: testMut.isPending ? 'A testar...' : 'Testar ligação' })] }), testMut.data && (_jsxs("div", { className: `mt-3 flex items-center gap-2 text-sm ${testMut.data.connected ? 'text-green-600' : 'text-red-500'}`, children: [testMut.data.connected ? _jsx(Wifi, { size: 14 }) : _jsx(WifiOff, { size: 14 }), testMut.data.connected ? 'Ligação OK' : 'Falhou — verifica o URL e as credenciais'] }))] }), !runResult && (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-5 mb-6", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Extrair cat\u00E1logo" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-500 mb-1", children: "M\u00E1ximo de p\u00E1ginas" }), _jsx("input", { type: "number", min: 1, max: 100, value: maxPages, onChange: e => setMaxPages(parseInt(e.target.value)), className: "w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm" })] }), _jsxs("button", { onClick: () => runMut.mutate(), disabled: runMut.isPending || !config?.baseUrl, className: "flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 mt-4", children: [_jsx(Play, { size: 14 }), runMut.isPending ? 'A extrair...' : 'Iniciar scraping'] })] }), runMut.isPending && (_jsxs("div", { className: "mt-4 text-sm text-gray-500 flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }), "A navegar no portal e a extrair produtos... (pode demorar alguns minutos)"] })), runMut.isError && (_jsxs("div", { className: "mt-4 flex items-center gap-2 text-red-500 text-sm", children: [_jsx(AlertCircle, { size: 14 }), runMut.error.message] }))] })), runResult && (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-gray-200", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-medium text-gray-900", children: ["Produtos encontrados: ", runResult.count] }), _jsxs("p", { className: "text-sm text-gray-500", children: [selected.size, " selecionados para importar"] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setRunResult(null), className: "px-3 py-2 text-sm text-gray-600 hover:text-gray-900", children: "Limpar" }), _jsxs("button", { onClick: () => importMut.mutate(), disabled: importMut.isPending || selected.size === 0, className: "flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40", children: [_jsx(Upload, { size: 14 }), importMut.isPending ? 'A importar...' : `Importar ${selected.size} produtos`] })] })] }), importMut.isSuccess && (_jsxs("div", { className: "flex items-center gap-2 px-5 py-3 bg-green-50 text-green-700 text-sm", children: [_jsx(CheckCircle, { size: 14 }), "Importados com sucesso!"] })), _jsx("div", { className: "overflow-auto max-h-96", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left", children: _jsx("input", { type: "checkbox", checked: selectedAll, onChange: e => {
                                                        setSelectedAll(e.target.checked);
                                                        setSelected(e.target.checked ? new Set(runResult.products.map((_, i) => i)) : new Set());
                                                    } }) }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "Nome" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "Ref." }), _jsx("th", { className: "px-4 py-3 text-right font-medium text-gray-600", children: "Pre\u00E7o custo" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "Categoria" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-100", children: runResult.products.map((p, i) => (_jsxs("tr", { className: `hover:bg-gray-50 ${selected.has(i) ? '' : 'opacity-50'}`, children: [_jsx("td", { className: "px-4 py-3", children: _jsx("input", { type: "checkbox", checked: selected.has(i), onChange: () => toggleSelect(i) }) }), _jsx("td", { className: "px-4 py-3 font-medium text-gray-900 max-w-xs truncate", children: p.name }), _jsx("td", { className: "px-4 py-3 text-gray-500 font-mono text-xs", children: p.supplier_ref }), _jsxs("td", { className: "px-4 py-3 text-right", children: [p.cost_price?.toFixed(2), " \u20AC"] }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: p.category || '—' })] }, i))) })] }) })] }))] }));
}
