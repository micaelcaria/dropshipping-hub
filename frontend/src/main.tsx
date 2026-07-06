import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import LoginPage from './pages/LoginPage'
import { auth } from './lib/api'
import './index.css'

const queryClient = new QueryClient()

function Root() {
  const [authed, setAuthed] = useState(!!auth.token)
  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />
  return (
    <BrowserRouter>
      <App onLogout={() => { auth.clear(); setAuthed(false) }} />
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </React.StrictMode>
)
