// backend/src/scraper/algolia.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface AlgoliaProduct {
  objectID: string;
  shortTitle: string;
  longTitle: string;
  author: string;
  isbn10: string;
  isbn13: string;
  bindingType: string;
  publisher: string;
  fromPrice: number;
  priceRanges: string[];
  productHandle: string;
  hierarchicalCategories: {
    lvl0?: string;
    lvl1?: string;
    lvl2?: string;
  };
  productType: string;
  quantity: number;
  inStock: boolean;
  seriesTitle?: string;
  imageURL: string;
  datePublished?: string;
  yearPublished?: number;
  genre?: string;
  tags: string[];
  categories: string[];
  isUk: boolean;
  isUsa: boolean;
  isUsed: boolean;
  isNew: boolean;
  availableConditions: string[];
  bestConditionPrice?: number;
}

export interface AlgoliaSearchResponse {
  hits: AlgoliaProduct[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
  facets?: Record<string, Record<string, number>>;
}

@Injectable()
export class AlgoliaService {
  private readonly logger = new Logger(AlgoliaService.name);
  private readonly appId: string;
  private readonly apiKey: string;
  private readonly indexName: string;
  private readonly baseUrl: string;
  private readonly DELAY_MS: number;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('ALGOLIA_APP_ID', 'AR33G9NJGJ');
    this.apiKey = this.configService.get<string>('ALGOLIA_API_KEY', '96c16938971ef89ae1d14e21494e2114');
    this.indexName = this.configService.get<string>('ALGOLIA_INDEX_NAME', 'shopify_products_us');
    this.baseUrl = `https://${this.appId}-dsn.algolia.net/1/indexes/${this.indexName}`;
    this.DELAY_MS = parseInt(this.configService.get<string>('SCRAPE_DELAY_MS', '500'));
  }

  private getHeaders() {
    return {
      'X-Algolia-API-Key': this.apiKey,
      'X-Algolia-Application-Id': this.appId,
      'Content-Type': 'application/json',
    };
  }

  private async delay(ms?: number): Promise<void> {
    const delayTime = ms || this.DELAY_MS + Math.random() * 500;
    this.logger.debug(`Waiting ${Math.round(delayTime)}ms before next Algolia request`);
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  /**
   * Search products from Algolia
   */
  async searchProducts(
    query: string = '',
    page: number = 0,
    hitsPerPage: number = 20,
    filters?: string,
    facetFilters?: string[][],
  ): Promise<AlgoliaSearchResponse> {
    await this.delay();

    const url = `${this.baseUrl}/query`;
    
    const requestBody: any = {
      query,
      page,
      hitsPerPage,
      attributesToRetrieve: [
        'objectID',
        'shortTitle',
        'longTitle',
        'author',
        'isbn10',
        'isbn13',
        'bindingType',
        'publisher',
        'fromPrice',
        'priceRanges',
        'productHandle',
        'hierarchicalCategories',
        'productType',
        'quantity',
        'inStock',
        'seriesTitle',
        'imageURL',
        'datePublished',
        'yearPublished',
        'genre',
        'tags',
        'categories',
        'isUk',
        'isUsa',
        'isUsed',
        'isNew',
        'availableConditions',
        'bestConditionPrice',
      ],
      facets: ['hierarchicalCategories.lvl0', 'hierarchicalCategories.lvl1', 'productType', 'author'],
      analytics: false,
    };

    if (filters) {
      requestBody.filters = filters;
    }

    if (facetFilters && facetFilters.length > 0) {
      requestBody.facetFilters = facetFilters;
    }

    try {
      this.logger.log(`Searching Algolia: query="${query}", page=${page}, hitsPerPage=${hitsPerPage}`);
      
      const response = await axios.post<AlgoliaSearchResponse>(url, requestBody, {
        headers: this.getHeaders(),
        timeout: 30000,
      });

      this.logger.log(`Algolia returned ${response.data.hits.length} products (total: ${response.data.nbHits})`);
      return response.data;
    } catch (error) {
      this.logger.error(`Algolia search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get products by category using hierarchicalCategories
   */
  async getProductsByCategory(
    category: string,
    page: number = 0,
    hitsPerPage: number = 20,
  ): Promise<AlgoliaSearchResponse> {
    // Use hierarchicalCategories filter
    const facetFilters = [[`hierarchicalCategories.lvl0:${category}`]];
    return this.searchProducts('', page, hitsPerPage, undefined, facetFilters);
  }

  /**
   * Get all product categories from hierarchicalCategories
   */
  async getCategories(): Promise<string[]> {
    await this.delay();

    try {
      this.logger.log('Fetching product categories from Algolia');
      
      // Use regular search with facets enabled
      const response = await this.searchProducts('', 0, 1);
      
      if (response.facets && response.facets['hierarchicalCategories.lvl0']) {
        const categories = Object.keys(response.facets['hierarchicalCategories.lvl0']).filter(Boolean);
        this.logger.log(`Found ${categories.length} categories from Algolia`);
        return categories;
      }
      
      this.logger.warn('No hierarchicalCategories facets found, using fallback');
      return this.getFallbackCategories();
    } catch (error) {
      this.logger.error(`Failed to get categories: ${error.message}`, error.stack);
      return this.getFallbackCategories();
    }
  }

  /**
   * Fallback categories
   */
  private getFallbackCategories(): string[] {
    return [
      'Children\'s Books',
      'Fiction',
      'Non-Fiction',
      'Biography & Autobiography',
      'History',
      'Science & Nature',
      'Religion & Spirituality',
      'Art & Photography',
      'Business & Economics',
      'Self-Help',
    ];
  }

  /**
   * Get a single product by handle
   */
 async getProductByHandle(handle: string): Promise<AlgoliaProduct | null> {
  await this.delay();

  try {
    // Use query instead of filters for handle matching
    const searchResponse = await this.searchProducts(handle, 0, 1);
    return searchResponse.hits[0] || null;
  } catch (error) {
    this.logger.error(`Failed to get product ${handle}: ${error.message}`);
    return null;
  }
}

  /**
   * Get related/similar products
   */
  async getRelatedProducts(category: string, excludeHandle: string, limit: number = 6): Promise<AlgoliaProduct[]> {
    try {
      const response = await this.getProductsByCategory(category, 0, limit + 1);
      return response.hits.filter((p) => p.productHandle !== excludeHandle).slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get related products: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract author from Algolia product
   */
  extractAuthor(product: AlgoliaProduct): string | null {
    return product.author || null;
  }

  /**
   * Extract title from Algolia product
   */
  extractTitle(product: AlgoliaProduct): string {
    return product.longTitle || product.shortTitle || 'Unknown Title';
  }

  /**
   * Extract price from Algolia product
   */
  extractPrice(product: AlgoliaProduct): number | null {
    return product.fromPrice || product.bestConditionPrice || null;
  }

  /**
   * Extract image URL from Algolia product
   */
  extractImageUrl(product: AlgoliaProduct): string {
    return product.imageURL || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400';
  }

  /**
   * Extract category from Algolia product
   */
  extractCategory(product: AlgoliaProduct): string {
    return product.hierarchicalCategories?.lvl0 || 
           product.hierarchicalCategories?.lvl1 || 
           product.categories?.[0] || 
           'General';
  }

  /**
   * Build product URL from handle
   */
  buildProductUrl(handle: string): string {
    return `https://www.worldofbooks.com/en-gb/products/${handle}`;
  }

  /**
   * Build category URL from category name
   */
  buildCategoryUrl(categoryName: string): string {
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `https://www.worldofbooks.com/en-gb/collections/${slug}`;
  }
}