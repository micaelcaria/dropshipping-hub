import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Eye } from 'lucide-react';
import { api } from '../lib/api';
const MARKETPLACES = [
    { id: 'olx', label: 'OLX', color: 'orange', description: 'CSV para import manual ou referência' },
    { id: 'vinted', label: 'Vinted', color: 'teal', description: 'Formato com categorias Vinted' },
    { id: 'wallapop', label: 'Wallapop', color: 'red', description: 'Formato Wallapop' },
    { id: 'amazon', label: 'Amazon', color: 'yellow', description: 'Flat File para Seller Central' },
    { id: 'fnac', label: 'Fnac', color: 'blue', description: 'CSV para Marketplace Fnac' },
    { id: 'temu', label: 'Temu', color: 'purple', description: 'Formato Temu Seller' },
];
export default function ExportPage() {
    const [selected, setSelected] = useState(new Set());
    const [preview, setPreview] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: () => api.products.list({ active: 'true' }),
    });
    const toggleSelect = (id) => setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const showPreview = async (marketplace, product) => {
        setPreview({ marketplace, product });
        const data = await api.export.preview(marketplace, product.id);
        setPreviewData(data);
    };
    const downloadCsv = (marketplace) => {
        const ids = selected.size > 0 ? [...selected] : undefined;
        window.open(api.export.csvUrl(marketplace, ids), '_blank');
    };
    return (_jsxs("div", { className: "p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-1", children: "Exportar" }), _jsx("p", { className: "text-sm text-gray-500 mb-8", children: "Gera ficheiros CSV formatados para cada marketplace" }), _jsx("div", { className: "grid grid-cols-3 gap-4 mb-8", children: MARKETPLACES.map(({ id, label, description }) => (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: label }), _jsxs("span", { className: "text-xs text-gray-400", children: [products.length, " produtos"] })] }), _jsx("p", { className: "text-xs text-gray-500 mb-4", children: description }), _jsx("div", { className: "flex gap-2", children: _jsxs("button", { onClick: () => downloadCsv(id), className: "flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700", children: [_jsx(Download, { size: 12 }), selected.size > 0 ? `${selected.size} selecionados` : 'Todos'] }) })] }, id))) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-200 flex items-center justify-between", children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Selecionar produtos espec\u00EDficos" }), selected.size > 0 && (_jsx("button", { onClick: () => setSelected(new Set()), className: "text-xs text-gray-500 hover:text-gray-900", children: "Limpar sele\u00E7\u00E3o" }))] }), _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left w-8", children: _jsx("input", { type: "checkbox", checked: selected.size === products.length && products.length > 0, onChange: e => setSelected(e.target.checked ? new Set(products.map(p => p.id)) : new Set()) }) }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "Produto" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "Origem" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "Pr\u00E9-visualizar como" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-100", children: products.map(product => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-3", children: _jsx("input", { type: "checkbox", checked: selected.has(product.id), onChange: () => toggleSelect(product.id) }) }), _jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: product.name }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${product.source === 'own' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`, children: product.source === 'own' ? 'Próprio' : 'Fornecedor' }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("div", { className: "flex gap-1.5 flex-wrap", children: MARKETPLACES.map(({ id, label }) => (_jsxs("button", { onClick: () => showPreview(id, product), className: "flex items-center gap-1 text-xs px-2 py-1 border border-gray-200 rounded hover:border-blue-400 hover:text-blue-600", children: [_jsx(Eye, { size: 10 }), " ", label] }, id))) }) })] }, product.id))) })] }), products.length === 0 && (_jsx("div", { className: "text-center py-12 text-gray-400 text-sm", children: "Sem produtos. Importa primeiro no cat\u00E1logo." }))] }), preview && (_jsx("div", { className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-gray-200", children: [_jsxs("h3", { className: "font-semibold text-gray-900", children: [preview.product.name, " \u2192 ", preview.marketplace.toUpperCase()] }), _jsx("button", { onClick: () => { setPreview(null); setPreviewData(null); }, className: "text-gray-400 hover:text-gray-600 text-xl", children: "\u00D7" })] }), _jsx("div", { className: "p-6", children: !previewData ? (_jsx("div", { className: "text-center text-gray-400 py-8", children: "A carregar..." })) : (_jsx("table", { className: "w-full text-sm", children: _jsx("tbody", { className: "divide-y divide-gray-100", children: Object.entries(previewData).map(([k, v]) => (_jsxs("tr", { children: [_jsx("td", { className: "py-2 pr-4 text-gray-500 font-medium whitespace-nowrap", children: k }), _jsx("td", { className: "py-2 text-gray-900 break-words", children: String(v) })] }, k))) }) })) })] }) }))] }));
}
