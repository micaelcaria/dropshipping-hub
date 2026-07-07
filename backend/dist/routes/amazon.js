import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const router = Router();
const __dir = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dir, '../../amazon.json');
const DEFAULT = {
    config: { mode: 'FBM', referralPct: 15, fbaFee: 3.0, vatPct: 23, minMarginPct: 15, minRoiPct: 30 },
    products: {},
};
function load() {
    if (!existsSync(FILE))
        return DEFAULT;
    try {
        const d = JSON.parse(readFileSync(FILE, 'utf8'));
        return { config: { ...DEFAULT.config, ...d.config }, products: d.products || {} };
    }
    catch {
        return DEFAULT;
    }
}
function save(s) { writeFileSync(FILE, JSON.stringify(s, null, 2)); }
router.get('/', (_req, res) => res.json(load()));
router.put('/config', (req, res) => {
    const s = load();
    s.config = { ...s.config, ...(req.body || {}) };
    save(s);
    res.json(s.config);
});
router.put('/product/:ref', (req, res) => {
    const s = load();
    const ref = req.params.ref;
    const next = { ...(s.products[ref] || {}), ...(req.body || {}) };
    Object.keys(next).forEach(k => {
        const v = next[k];
        if (v === null || v === undefined || v === '')
            delete next[k];
    });
    if (Object.keys(next).length === 0)
        delete s.products[ref];
    else
        s.products[ref] = next;
    save(s);
    res.json(s.products[ref] || {});
});
export default router;
