import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
const AUTH_EMAIL = process.env.AUTH_EMAIL || 'geral@manutinstal.pt';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'Drop@2026';
// Segredo para assinar tokens — muda a cada arranque se não vier do ambiente (invalida sessões antigas)
const SECRET = process.env.AUTH_SECRET || randomBytes(32).toString('hex');
const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN_TTL_MS = 7 * DAY_MS;
function safeEqual(a, b) {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length)
        return false;
    return timingSafeEqual(ba, bb);
}
export function issueToken() {
    const exp = Date.now() + TOKEN_TTL_MS;
    const payload = `${exp}`;
    const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
    return Buffer.from(`${payload}.${sig}`).toString('base64url');
}
function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const [payload, sig] = decoded.split('.');
        if (!payload || !sig)
            return false;
        const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
        if (!safeEqual(sig, expected))
            return false;
        return parseInt(payload, 10) > Date.now();
    }
    catch {
        return false;
    }
}
export function checkCredentials(email, password) {
    return safeEqual((email || '').trim().toLowerCase(), AUTH_EMAIL.toLowerCase())
        && safeEqual(password || '', AUTH_PASSWORD);
}
export function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const headerToken = header.startsWith('Bearer ') ? header.slice(7) : '';
    // Downloads (ex.: CSV export) abrem por URL direto sem header — aceitar ?token=
    const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
    const token = headerToken || queryToken;
    if (token && verifyToken(token))
        return next();
    res.status(401).json({ error: 'Não autenticado' });
}
