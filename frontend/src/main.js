import { jsx as _jsx } from "react/jsx-runtime";
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import LoginPage from './pages/LoginPage';
import { auth } from './lib/api';
import './index.css';
const queryClient = new QueryClient();
function Root() {
    const [authed, setAuthed] = useState(!!auth.token);
    if (!authed)
        return _jsx(LoginPage, { onLogin: () => setAuthed(true) });
    return (_jsx(BrowserRouter, { children: _jsx(App, { onLogout: () => { auth.clear(); setAuthed(false); } }) }));
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(Root, {}) }) }));
