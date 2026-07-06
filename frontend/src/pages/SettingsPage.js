import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
export default function SettingsPage() {
    const qc = useQueryClient();
    const { data: config } = useQuery({ queryKey: ['scraper-config'], queryFn: api.scraper.getConfig });
    const [url, setUrl] = useState('');
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [selectors, setSelectors] = useState({});
    const [showSelectors, setShowSelectors] = useState(false);
    const [saved, setSaved] = useState(false);
    const saveMut = useMutation({
        mutationFn: () => api.scraper.setConfig({
            ...(url && { baseUrl: url }),
            ...(user && { username: user }),
            ...(pass && { password: pass }),
            ...(Object.keys(selectors).length && { selectors }),
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['scraper-config'] });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        },
    });
    const setSel = (key, value) => setSelectors(prev => ({ ...prev, [key]: value }));
    const selectorFields = [
        { key: 'productList', label: 'Lista de produtos', placeholder: '.product, article' },
        { key: 'name', label: 'Nome do produto', placeholder: 'h1, h2, .name' },
        { key: 'price', label: 'Preço', placeholder: '.price, [class*="price"]' },
        { key: 'description', label: 'Descrição', placeholder: '.description' },
        { key: 'image', label: 'Imagem', placeholder: 'img' },
        { key: 'sku', label: 'SKU/Ref', placeholder: '[data-sku], [data-ref]' },
        { key: 'brand', label: 'Marca', placeholder: '[class*="brand"]' },
        { key: 'category', label: 'Categoria', placeholder: '[class*="category"]' },
        { key: 'nextPage', label: 'Próxima página', placeholder: 'a[rel="next"], .next' },
    ];
    return (_jsxs("div", { className: "p-8 max-w-2xl", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-1", children: "Configura\u00E7\u00F5es" }), _jsx("p", { className: "text-sm text-gray-500 mb-8", children: "Configura o scraper do fornecedor" }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 divide-y divide-gray-100", children: [_jsxs("div", { className: "p-5", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Portal do fornecedor" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "URL do cat\u00E1logo" }), _jsx("input", { type: "url", placeholder: config?.baseUrl || 'https://fornecedor.com/catalogo', value: url, onChange: e => setUrl(e.target.value), className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" }), config?.baseUrl && !url && (_jsxs("p", { className: "text-xs text-gray-400 mt-1", children: ["Atual: ", config.baseUrl] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Utilizador (opcional)" }), _jsx("input", { placeholder: config?.username ? '***' : 'user@email.com', value: user, onChange: e => setUser(e.target.value), className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Password (opcional)" }), _jsx("input", { type: "password", placeholder: config?.hasPassword ? '••••••••' : 'password', value: pass, onChange: e => setPass(e.target.value), className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })] })] }), _jsxs("div", { className: "p-5", children: [_jsxs("button", { onClick: () => setShowSelectors(s => !s), className: "flex items-center justify-between w-full text-left", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Seletores CSS avan\u00E7ados" }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Personaliza os seletores se o scraper autom\u00E1tico n\u00E3o funcionar bem" })] }), showSelectors ? _jsx(ChevronUp, { size: 16, className: "text-gray-400" }) : _jsx(ChevronDown, { size: 16, className: "text-gray-400" })] }), showSelectors && (_jsx("div", { className: "mt-4 space-y-3", children: selectorFields.map(({ key, label, placeholder }) => (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: label }), _jsx("input", { placeholder: config?.selectors?.[key] || placeholder, value: selectors[key] || '', onChange: e => setSel(key, e.target.value), className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" })] }, key))) }))] })] }), _jsxs("div", { className: "mt-4 flex items-center gap-3", children: [_jsxs("button", { onClick: () => saveMut.mutate(), disabled: saveMut.isPending, className: "flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40", children: [_jsx(Save, { size: 14 }), saveMut.isPending ? 'A guardar...' : 'Guardar configurações'] }), saved && _jsx("span", { className: "text-green-600 text-sm", children: "Guardado!" })] }), _jsxs("div", { className: "mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800", children: [_jsx("strong", { children: "Dica:" }), " Se o scraper n\u00E3o extrair os produtos corretamente, abre o portal do fornecedor no browser, clica com o bot\u00E3o direito num produto e seleciona \"Inspecionar\" para identificar os seletores CSS corretos. Preenche os campos acima com esses seletores e o scraper ficar\u00E1 mais preciso."] })] }));
}
