import { Routes, Route, NavLink } from 'react-router-dom'
import { Package, Download, Settings, LayoutDashboard, GitCompare, LogOut, Tag, ShoppingCart } from 'lucide-react'
import CatalogPage from './pages/CatalogPage'
import ImportPage from './pages/ImportPage'
import ExportPage from './pages/ExportPage'
import SettingsPage from './pages/SettingsPage'
import ComparePage from './pages/ComparePage'
import PricingPage from './pages/PricingPage'
import AmazonPage from './pages/AmazonPage'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/catalog', icon: Package, label: 'Catálogo' },
  { to: '/compare', icon: GitCompare, label: 'Vertente Hub' },
  { to: '/pricing', icon: Tag, label: 'Preços & Portes' },
  { to: '/amazon', icon: ShoppingCart, label: 'Análise Amazon' },
  { to: '/import', icon: Download, label: 'Importar' },
  { to: '/export', icon: Download, label: 'Exportar' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
]

export default function App({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-600">Dropshipping Hub</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestão centralizada</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        {onLogout && (
          <button
            onClick={onLogout}
            className="m-3 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/amazon" element={<AmazonPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

function DashboardPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
      <p className="text-gray-500 mb-8">Visão geral do teu negócio</p>
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Produtos ativos', value: '—', color: 'blue' },
          { label: 'Produtos próprios', value: '—', color: 'green' },
          { label: 'Do fornecedor', value: '—', color: 'purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-3">Começar</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Vai a <strong>Configurações</strong> e configura o URL do portal do fornecedor</li>
          <li>Em <strong>Importar</strong>, testa a ligação e faz scraping do catálogo</li>
          <li>Revê os produtos no <strong>Catálogo</strong> e define preços por marketplace</li>
          <li>Em <strong>Exportar</strong>, descarrega CSVs formatados para cada plataforma</li>
        </ol>
      </div>
    </div>
  )
}
