import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import productsRouter from './routes/products.js';
import scraperRouter from './routes/scraper.js';
import exportRouter from './routes/export.js';
import catalogRouter from './routes/catalog.js';
import { startAutoSync } from './sync.js';
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/products', productsRouter);
app.use('/api/scraper', scraperRouter);
app.use('/api/export', exportRouter);
app.use('/api/catalog', catalogRouter);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
// Em produção serve o frontend buildado (frontend/dist copiado para ./public)
const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dir, '../public');
if (existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (_req, res) => res.sendFile(join(publicDir, 'index.html')));
}
app.listen(PORT, () => {
    console.log(`Backend running on :${PORT}`);
    startAutoSync();
});
