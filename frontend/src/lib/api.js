const BASE = '/api';
const TOKEN_KEY = 'drophub_token';
export const auth = {
    get token() { return localStorage.getItem(TOKEN_KEY); },
    set(token) { localStorage.setItem(TOKEN_KEY, token); },
    clear() { localStorage.removeItem(TOKEN_KEY); },
    async login(email, password) {
        const res = await fetch(BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Falha no login' }));
            throw new Error(err.error || 'Falha no login');
        }
        const data = await res.json();
        auth.set(data.token);
        return data;
    },
};
async function req(path, options) {
    const token = auth.token;
    const res = await fetch(BASE + path, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
        ...options,
    });
    if (res.status === 401) {
        auth.clear();
        window.location.reload();
        throw new Error('Sessão expirada');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }
    if (res.status === 204)
        return undefined;
    return res.json();
}
// Products
export const api = {
    products: {
        list: (params) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return req(`/products${qs}`);
        },
        get: (id) => req(`/products/${id}`),
        create: (data) => req('/products', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => req(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id) => req(`/products/${id}`, { method: 'DELETE' }),
        bulkImport: (products) => req('/products/bulk', { method: 'POST', body: JSON.stringify({ products }) }),
    },
    scraper: {
        getConfig: () => req('/scraper/config'),
        setConfig: (config) => req('/scraper/config', { method: 'POST', body: JSON.stringify(config) }),
        test: () => req('/scraper/test', { method: 'POST' }),
        run: (maxPages) => req('/scraper/run', { method: 'POST', body: JSON.stringify({ maxPages }) }),
    },
    export: {
        csvUrl: (marketplace, ids) => {
            const params = new URLSearchParams();
            if (ids)
                params.set('ids', ids.join(','));
            if (auth.token)
                params.set('token', auth.token);
            const qs = params.toString();
            return `${BASE}/export/${marketplace}/csv${qs ? '?' + qs : ''}`;
        },
        preview: (marketplace, productId) => req(`/export/${marketplace}/preview/${productId}`),
    },
};
