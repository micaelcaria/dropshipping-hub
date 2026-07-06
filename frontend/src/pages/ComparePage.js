import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Search, Package, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import { auth } from '../lib/api';
const authHeaders = () => (auth.token ? { Authorization: `Bearer ${auth.token}` } : {});
export default function ComparePage() {
    const [search, setSearch] = useState('');
    const [expandedCats, setExpandedCats] = useState(new Set(['all']));
    const [showMissingPrice, setShowMissingPrice] = useState(false);
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: ['catalog'],
        queryFn: () => fetch('/api/catalog', { headers: authHeaders() }).then(r => r.json()),
    });
    const syncMutation = useMutation({
        mutationFn: () => fetch('/api/catalog/sync', { method: 'POST', headers: authHeaders() }).then(r => r.json()),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
    });
    const products = data?.products ?? [];
    const filtered = useMemo(() => {
        let list = products;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) ||
                p.supplier_ref?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q) ||
                p.attributes?.EAN?.includes(q));
        }
        if (showMissingPrice)
            list = list.filter(p => !p.cost_price);
        return list;
    }, [products, search, showMissingPrice]);
    // Group by category
    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach(p => {
            const cat = p.category || 'Sem categoria';
            if (!map.has(cat))
                map.set(cat, []);
            map.get(cat).push(p);
        });
        return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
    }, [filtered]);
    const withPrice = products.filter(p => p.cost_price > 0).length;
    const withStock = products.filter(p => p.stock && !/indispon|esgotado|0/i.test(p.stock)).length;
    const lastSync = data?.lastSync;
    const syncResult = syncMutation.data;
    const toggleCat = (cat) => {
        setExpandedCats(prev => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    };
    const expandAll = () => setExpandedCats(new Set(grouped.map(([cat]) => cat)));
    const collapseAll = () => setExpandedCats(new Set());
    return (_jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "mb-6 flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Cat\u00E1logo Vertente Hub" }), _jsxs("p", { className: "text-sm text-gray-500 mt-0.5", children: ["Sincronizado da folha de stock do fornecedor (atualizada 2x/dia)", lastSync?.syncedAt && (_jsxs("span", { className: "ml-2 text-gray-400", children: ["\u00B7 \u00FAltima sync: ", new Date(lastSync.syncedAt).toLocaleString('pt-PT')] }))] })] }), _jsxs("button", { onClick: () => syncMutation.mutate(), disabled: syncMutation.isPending, className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: [_jsx(RefreshCw, { size: 14, className: syncMutation.isPending ? 'animate-spin' : '' }), syncMutation.isPending ? 'A sincronizar...' : 'Sincronizar agora'] })] }), syncResult && (_jsx("div", { className: `rounded-xl p-4 mb-6 text-sm ${syncResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`, children: syncResult.ok ? (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Sincronizado:" }), " ", syncResult.total, " produtos", syncResult.added.length > 0 && _jsxs(_Fragment, { children: [" \u00B7 ", _jsxs("strong", { children: [syncResult.added.length, " novos"] })] }), syncResult.removed.length > 0 && _jsxs(_Fragment, { children: [" \u00B7 ", _jsxs("strong", { children: [syncResult.removed.length, " removidos"] })] }), syncResult.stockChanges.length > 0 && _jsxs(_Fragment, { children: [" \u00B7 ", _jsxs("strong", { children: [syncResult.stockChanges.length, " altera\u00E7\u00F5es de stock"] })] }), syncResult.priceChanges.length > 0 && _jsxs(_Fragment, { children: [" \u00B7 ", _jsxs("strong", { children: [syncResult.priceChanges.length, " altera\u00E7\u00F5es de pre\u00E7o"] })] }), syncResult.added.length === 0 && syncResult.removed.length === 0 &&
                            syncResult.stockChanges.length === 0 && syncResult.priceChanges.length === 0 && _jsx(_Fragment, { children: " \u00B7 sem altera\u00E7\u00F5es" }), syncResult.stockChanges.length > 0 && (_jsxs("ul", { className: "mt-2 space-y-0.5 text-xs", children: [syncResult.stockChanges.slice(0, 10).map(c => (_jsxs("li", { children: ["\u2022 ", c.name.slice(0, 60), ": ", _jsx("span", { className: "line-through opacity-60", children: c.before }), " \u2192 ", _jsx("strong", { children: c.after })] }, c.ref))), syncResult.stockChanges.length > 10 && _jsxs("li", { children: ["\u2026 e mais ", syncResult.stockChanges.length - 10] })] }))] })) : (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Erro na sincroniza\u00E7\u00E3o:" }), " ", syncResult.error] })) })), _jsx("div", { className: "grid grid-cols-4 gap-4 mb-6", children: [
                    { label: 'Total de produtos', value: products.length, color: 'blue' },
                    { label: 'Com stock', value: withStock, color: 'green' },
                    { label: 'Com preço', value: withPrice, color: 'orange' },
                    { label: 'Categorias', value: grouped.length, color: 'purple' },
                ].map(({ label, value, color }) => (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-4", children: [_jsx("p", { className: "text-xs text-gray-500", children: label }), _jsx("p", { className: `text-2xl font-bold text-${color}-600 mt-1`, children: value })] }, label))) }), _jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsxs("div", { className: "relative flex-1 max-w-sm", children: [_jsx(Search, { size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Pesquisar nome, ref, EAN, marca...", value: search, onChange: e => setSearch(e.target.value), className: "w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: showMissingPrice, onChange: e => setShowMissingPrice(e.target.checked) }), "S\u00F3 sem pre\u00E7o"] }), _jsxs("div", { className: "ml-auto flex gap-2 text-xs", children: [_jsx("button", { onClick: expandAll, className: "text-blue-600 hover:underline", children: "Expandir tudo" }), _jsx("span", { className: "text-gray-300", children: "|" }), _jsx("button", { onClick: collapseAll, className: "text-blue-600 hover:underline", children: "Colapsar tudo" })] })] }), isLoading && _jsx("div", { className: "text-center py-16 text-gray-400", children: "A carregar..." }), error && (_jsxs("div", { className: "flex items-center gap-2 text-red-500 bg-red-50 rounded-xl p-4 mb-4", children: [_jsx(AlertCircle, { size: 16 }), "Backend n\u00E3o est\u00E1 a correr. Inicia o servidor backend primeiro."] })), !isLoading && products.length === 0 && !error && (_jsxs("div", { className: "text-center py-16 text-gray-400", children: [_jsx(Package, { size: 40, className: "mx-auto mb-3 opacity-30" }), _jsxs("p", { children: ["Scraper ainda n\u00E3o foi executado. Vai a ", _jsx("strong", { children: "Importar" }), " para extrair o cat\u00E1logo."] })] })), _jsx("div", { className: "space-y-3", children: grouped.map(([cat, prods]) => {
                    const isOpen = expandedCats.has(cat);
                    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 overflow-hidden", children: [_jsxs("button", { onClick: () => toggleCat(cat), className: "w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "font-medium text-gray-900", children: cat }), _jsxs("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full", children: [prods.length, " produtos"] }), _jsxs("span", { className: "text-xs text-green-600", children: [prods.filter(p => p.cost_price > 0).length, " com pre\u00E7o"] })] }), isOpen ? _jsx(ChevronUp, { size: 16, className: "text-gray-400" }) : _jsx(ChevronDown, { size: 16, className: "text-gray-400" })] }), isOpen && (_jsx("div", { className: "border-t border-gray-100 overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-4 py-2 font-medium text-gray-500 text-xs w-12" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-gray-500 text-xs", children: "Produto" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-gray-500 text-xs", children: "Ref" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-gray-500 text-xs", children: "EAN" }), _jsx("th", { className: "text-left px-4 py-2 font-medium text-gray-500 text-xs", children: "Marca" }), _jsx("th", { className: "text-right px-4 py-2 font-medium text-gray-500 text-xs", children: "Pre\u00E7o custo" }), _jsx("th", { className: "text-center px-4 py-2 font-medium text-gray-500 text-xs", children: "Stock" }), _jsx("th", { className: "text-center px-4 py-2 font-medium text-gray-500 text-xs", children: "Imgs" }), _jsx("th", { className: "px-4 py-2 text-xs" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-50", children: prods.map(p => (_jsxs("tr", { className: "hover:bg-blue-50/30 transition-colors", children: [_jsx("td", { className: "px-4 py-2", children: p.images[0]
                                                            ? _jsx("img", { src: p.images[0], alt: "", className: "w-9 h-9 rounded object-cover bg-gray-100" })
                                                            : _jsx("div", { className: "w-9 h-9 rounded bg-gray-100" }) }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: "font-medium text-gray-900 line-clamp-1 max-w-xs block", children: p.name }) }), _jsx("td", { className: "px-4 py-2 text-gray-500 font-mono text-xs", children: p.supplier_ref }), _jsx("td", { className: "px-4 py-2 text-gray-400 font-mono text-xs", children: p.attributes?.EAN || '—' }), _jsx("td", { className: "px-4 py-2 text-gray-500 text-xs", children: p.brand || '—' }), _jsx("td", { className: "px-4 py-2 text-right", children: p.cost_price > 0
                                                            ? _jsxs("span", { className: "font-semibold text-gray-900", children: [p.cost_price.toFixed(2), " \u20AC"] })
                                                            : _jsx("span", { className: "text-orange-400 text-xs", children: "sem pre\u00E7o" }) }), _jsx("td", { className: "px-4 py-2 text-center", children: p.stock ? (/indispon|esgotado/i.test(p.stock)
                                                            ? _jsx("span", { className: "text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600", children: p.stock })
                                                            : _jsx("span", { className: "text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700", children: p.stock })) : _jsx("span", { className: "text-gray-300 text-xs", children: "\u2014" }) }), _jsx("td", { className: "px-4 py-2 text-center text-gray-400 text-xs", children: p.images.length }), _jsx("td", { className: "px-4 py-2", children: p.supplier_url && (_jsx("a", { href: p.supplier_url, target: "_blank", rel: "noreferrer", className: "text-gray-300 hover:text-blue-500 transition-colors", title: "Ver no Vertente Hub", children: _jsx(ExternalLink, { size: 13 }) })) })] }, p.supplier_ref))) })] }) }))] }, cat));
                }) })] }));
}
