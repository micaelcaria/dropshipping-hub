import { chromium } from 'playwright';
import { BaseScraper } from './base.js';
/**
 * Generic scraper configurable via CSS selectors.
 * Configure via environment variables or the /api/scraper/config endpoint.
 */
export class GenericScraper extends BaseScraper {
    sel;
    constructor(config) {
        super(config);
        this.sel = {
            productList: config.selectors?.productList || '.product, [class*="product"], article',
            name: config.selectors?.name || 'h1, h2, .name, .title',
            price: config.selectors?.price || '.price, [class*="price"]',
            description: config.selectors?.description || '.description, [class*="description"]',
            image: config.selectors?.image || 'img',
            sku: config.selectors?.sku || '[data-sku], [class*="ref"], [class*="sku"]',
            brand: config.selectors?.brand || '[class*="brand"]',
            category: config.selectors?.category || '[class*="category"], [class*="categ"]',
            nextPage: config.selectors?.nextPage || 'a[rel="next"], .next, [class*="next"]',
            ...config.selectors,
        };
    }
    async testConnection() {
        const browser = await chromium.launch({ headless: true });
        try {
            const page = await browser.newPage();
            const response = await page.goto(this.config.baseUrl, { timeout: 15000 });
            return (response?.status() ?? 0) < 400;
        }
        catch {
            return false;
        }
        finally {
            await browser.close();
        }
    }
    async scrapeProducts(maxPages = 10) {
        const browser = await chromium.launch({ headless: true });
        const products = [];
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            // Login if credentials provided
            if (this.config.username && this.config.password) {
                await this.login(page);
            }
            let currentUrl = this.config.baseUrl;
            let pageNum = 0;
            while (currentUrl && pageNum < maxPages) {
                await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 30000 });
                pageNum++;
                const pageProducts = await this.extractFromPage(page);
                products.push(...pageProducts);
                // Navigate to next page
                const nextHref = await page.$eval(this.sel.nextPage, (el) => el.href).catch(() => null);
                currentUrl = nextHref || '';
            }
        }
        finally {
            await browser.close();
        }
        return products;
    }
    async login(page) {
        await page.goto(this.config.baseUrl, { waitUntil: 'networkidle' });
        const usernameInput = await page.$('input[type="email"], input[name*="user"], input[name*="email"], input[id*="user"]');
        const passwordInput = await page.$('input[type="password"]');
        const submit = await page.$('button[type="submit"], input[type="submit"]');
        if (usernameInput && passwordInput && submit) {
            await usernameInput.fill(this.config.username);
            await passwordInput.fill(this.config.password);
            await submit.click();
            await page.waitForNavigation({ timeout: 10000 }).catch(() => { });
        }
    }
    async extractFromPage(page) {
        return page.evaluate((sel) => {
            const items = document.querySelectorAll(sel.productList);
            const products = [];
            items.forEach((item, i) => {
                const text = (s) => item.querySelector(s)?.textContent?.trim() || '';
                const attr = (s, a) => item.querySelector(s)?.getAttribute(a) || '';
                const rawPrice = text(sel.price).replace(/[^\d.,]/g, '').replace(',', '.');
                const price = parseFloat(rawPrice);
                if (!text(sel.name))
                    return;
                const img = attr(sel.image, 'src') || attr(sel.image, 'data-src');
                products.push({
                    name: text(sel.name),
                    supplier_ref: attr('[data-id]', 'data-id') || attr('[data-sku]', 'data-sku') || `item-${i}-${Date.now()}`,
                    description: text(sel.description) || undefined,
                    cost_price: isNaN(price) ? 0 : price,
                    images: img ? [img] : [],
                    brand: text(sel.brand) || undefined,
                    category: text(sel.category) || undefined,
                    supplier_url: window.location.href,
                });
            });
            return products;
        }, this.sel);
    }
}
