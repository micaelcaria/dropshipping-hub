export interface ScrapedProduct {
  name: string
  supplier_ref: string
  description?: string
  cost_price: number
  images: string[]
  category?: string
  brand?: string
  weight_kg?: number
  stock?: number
  supplier_url?: string
  attributes?: Record<string, string>
}

export interface ScraperConfig {
  baseUrl: string
  username?: string
  password?: string
  selectors?: Record<string, string>
}

export abstract class BaseScraper {
  constructor(protected config: ScraperConfig) {}
  abstract scrapeProducts(maxPages?: number): Promise<ScrapedProduct[]>
  abstract testConnection(): Promise<boolean>
}
