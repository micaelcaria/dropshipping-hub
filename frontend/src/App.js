import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, NavLink } from 'react-router-dom';
import { Package, Download, Settings, LayoutDashboard, GitCompare, LogOut } from 'lucide-react';
import CatalogPage from './pages/CatalogPage';
import ImportPage from './pages/ImportPage';
import ExportPage from './pages/ExportPage';
import SettingsPage from './pages/SettingsPage';
import ComparePage from './pages/ComparePage';
const nav = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/catalog', icon: Package, label: 'Catálogo' },
    { to: '/compare', icon: GitCompare, label: 'Vertente Hub' },
    { to: '/import', icon: Download, label: 'Importar' },
    { to: '/export', icon: Download, label: 'Exportar' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
];
export default function App({ onLogout }) {
    return (_jsxs("div", { className: "flex h-screen bg-gray-50", children: [_jsxs("aside", { className: "w-56 bg-white border-r border-gray-200 flex flex-col", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-200", children: [_jsx("h1", { className: "text-lg font-bold text-blue-600", children: "Dropshipping Hub" }), _jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Gest\u00E3o centralizada" })] }), _jsx("nav", { className: "flex-1 px-3 py-4 space-y-1", children: nav.map(({ to, icon: Icon, label }) => (_jsxs(NavLink, { to: to, end: to === '/', className: ({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`, children: [_jsx(Icon, { size: 16 }), label] }, to))) }), onLogout && (_jsxs("button", { onClick: onLogout, className: "m-3 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors", children: [_jsx(LogOut, { size: 16 }), "Sair"] }))] }), _jsx("main", { className: "flex-1 overflow-auto", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/catalog", element: _jsx(CatalogPage, {}) }), _jsx(Route, { path: "/import", element: _jsx(ImportPage, {}) }), _jsx(Route, { path: "/export", element: _jsx(ExportPage, {}) }), _jsx(Route, { path: "/compare", element: _jsx(ComparePage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) })] }) })] }));
}
function DashboardPage() {
    return (_jsxs("div", { className: "p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Dashboard" }), _jsx("p", { className: "text-gray-500 mb-8", children: "Vis\u00E3o geral do teu neg\u00F3cio" }), _jsx("div", { className: "grid grid-cols-3 gap-6", children: [
                    { label: 'Produtos ativos', value: '—', color: 'blue' },
                    { label: 'Produtos próprios', value: '—', color: 'green' },
                    { label: 'Do fornecedor', value: '—', color: 'purple' },
                ].map(({ label, value, color }) => (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("p", { className: "text-sm text-gray-500", children: label }), _jsx("p", { className: `text-3xl font-bold mt-1 text-${color}-600`, children: value })] }, label))) }), _jsxs("div", { className: "mt-8 bg-white rounded-xl border border-gray-200 p-6", children: [_jsx("h3", { className: "font-semibold text-gray-700 mb-3", children: "Come\u00E7ar" }), _jsxs("ol", { className: "space-y-2 text-sm text-gray-600 list-decimal list-inside", children: [_jsxs("li", { children: ["Vai a ", _jsx("strong", { children: "Configura\u00E7\u00F5es" }), " e configura o URL do portal do fornecedor"] }), _jsxs("li", { children: ["Em ", _jsx("strong", { children: "Importar" }), ", testa a liga\u00E7\u00E3o e faz scraping do cat\u00E1logo"] }), _jsxs("li", { children: ["Rev\u00EA os produtos no ", _jsx("strong", { children: "Cat\u00E1logo" }), " e define pre\u00E7os por marketplace"] }), _jsxs("li", { children: ["Em ", _jsx("strong", { children: "Exportar" }), ", descarrega CSVs formatados para cada plataforma"] })] })] })] }));
}
