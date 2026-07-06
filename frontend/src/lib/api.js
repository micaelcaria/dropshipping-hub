const BASE = '/api';
async function req(path, options) {
    const res = await fetch(BASE + path, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });
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
            const qs = ids ? `?ids=${ids.join(',')}` : '';
            return `${BASE}/export/${marketplace}/csv${qs}`;
        },
        preview: (marketplace, productId) => req(`/export/${marketplace}/preview/${productId}`),
    },
};
