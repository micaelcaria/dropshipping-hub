import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dir = dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = join(__dir, '../scraper-output.json');
const SYNC_META_FILE = join(__dir, '../sync-meta.json');
const SHEET_ID = process.env.SHEET_ID || '1Jjlp-qBuykzsbeerH7Ex8HmCmDI55nLItB7_CD3S_7k';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const PHOTO_COLS = ['photo', ...Array.from({ length: 15 }, (_, i) => `additional_photo_${i + 1}`)];
// Minimal CSV parser that handles quoted multiline fields
function parseCSV(text) {
    const rows = [];
    let cur = '', inQ = false;
    let fields = [];
    let headers = null;
    const pushRow = () => {
        fields.push(cur);
        cur = '';
        if (!headers)
            headers = fields.map(h => h.trim());
        else if (fields.some(f => f.trim())) {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = (fields[i] ?? '').trim(); });
            rows.push(obj);
        }
        fields = [];
    };
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQ && text[i + 1] === '"') {
                cur += '"';
                i++;
            }
            else
                inQ = !inQ;
        }
        else if (c === ',' && !inQ) {
            fields.push(cur);
            cur = '';
        }
        else if ((c === '\r' || c === '\n') && !inQ) {
            if (c === '\r' && text[i + 1] === '\n')
                i++;
            pushRow();
        }
        else
            cur += c;
    }
    if (cur || fields.length)
        pushRow();
    return rows;
}
export async function syncFromSheet() {
    const syncedAt = new Date().toISOString();
    try {
        const res = await fetch(CSV_URL, { redirect: 'follow' });
        if (!res.ok)
            throw new Error(`HTTP ${res.status} ao obter a folha`);
        const text = await res.text();
        const rows = parseCSV(text);
        const products = rows
            .filter(r => r['Produto'])
            .map((r, idx) => {
            const priceStr = (r['Preço s/IVA'] || '').replace('€', '').replace(',', '.').trim();
            const price = parseFloat(priceStr) || 0;
            const images = PHOTO_COLS.map(c => r[c] || '').filter(u => u.startsWith('http'));
            const sku = r['SKU'] || '';
            return {
                name: r['Produto'],
                supplier_ref: sku || `vh-${idx}`,
                description: r['description'] || '',
                cost_price: price,
                images,
                category: r['Categoria'] || 'Sem categoria',
                brand: r['Fabricante'] || '',
                stock: r['Stock/Estoque'] || '',
                supplier_url: '',
                attributes: { EAN: r['EAN'] || '' },
            };
        });
        if (products.length === 0)
            throw new Error('Folha vazia ou formato inesperado');
        // Diff against previous data
        const added = [];
        const removed = [];
        const stockChanges = [];
        const priceChanges = [];
        // SKUs/EANs are not always unique in the sheet ("-" placeholders), so key on sku+ean+name
        const keyOf = (p) => `${p.supplier_ref}|${p.attributes.EAN}|${p.name}`;
        if (existsSync(OUTPUT_FILE)) {
            const prev = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'));
            const prevMap = new Map(prev.map(p => [keyOf(p), p]));
            const newMap = new Map(products.map(p => [keyOf(p), p]));
            for (const p of products) {
                const old = prevMap.get(keyOf(p));
                if (!old) {
                    added.push(`${p.supplier_ref} ${p.name}`);
                    continue;
                }
                if (old.stock !== p.stock) {
                    stockChanges.push({ ref: p.supplier_ref, name: p.name, before: old.stock ?? '', after: p.stock });
                }
                if (old.cost_price !== p.cost_price) {
                    priceChanges.push({ ref: p.supplier_ref, name: p.name, before: old.cost_price, after: p.cost_price });
                }
            }
            for (const p of prev) {
                if (!newMap.has(keyOf(p)))
                    removed.push(`${p.supplier_ref} ${p.name}`);
            }
        }
        writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
        const result = { ok: true, total: products.length, added, removed, stockChanges, priceChanges, syncedAt };
        writeFileSync(SYNC_META_FILE, JSON.stringify(result, null, 2));
        console.log(`[sync] ${syncedAt} — ${products.length} produtos | +${added.length} novos, -${removed.length} removidos, ${stockChanges.length} alterações de stock, ${priceChanges.length} de preço`);
        return result;
    }
    catch (e) {
        const result = {
            ok: false, total: 0, added: [], removed: [], stockChanges: [], priceChanges: [],
            syncedAt, error: e.message,
        };
        console.error(`[sync] falhou: ${result.error}`);
        return result;
    }
}
export function getLastSync() {
    if (!existsSync(SYNC_META_FILE))
        return null;
    return JSON.parse(readFileSync(SYNC_META_FILE, 'utf8'));
}
// Auto-sync every 6h (supplier updates the sheet 2x/day)
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
export function startAutoSync() {
    setInterval(() => { syncFromSheet(); }, SYNC_INTERVAL_MS);
    console.log('[sync] auto-sync ativo (a cada 6 horas)');
}
