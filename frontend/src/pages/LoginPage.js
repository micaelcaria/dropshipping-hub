import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { LogIn, Lock } from 'lucide-react';
import { auth } from '../lib/api';
export default function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await auth.login(email, password);
            onLogin();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 p-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-3", children: _jsx(Lock, { size: 22 }) }), _jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Dropshipping Hub" }), _jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Acesso restrito" })] }), _jsxs("form", { onSubmit: submit, className: "bg-white rounded-2xl border border-gray-200 p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-600 mb-1", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), autoFocus: true, required: true, className: "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "email@exemplo.pt" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-600 mb-1", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), required: true, className: "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), error && _jsx("div", { className: "text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2", children: error }), _jsxs("button", { type: "submit", disabled: loading, className: "w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: [_jsx(LogIn, { size: 16 }), loading ? 'A entrar...' : 'Entrar'] })] })] }) }));
}
