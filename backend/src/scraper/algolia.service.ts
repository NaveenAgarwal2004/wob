import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface AlgoliaProduct {
  objectID: string;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  price: number;
  price_min: number;
  price_max: number;
  variants_count: number;
  image: string;
  images: {
    src: string;
    width: number;
    height: number;
    alt?: string;
  }[];
  inventory_management: string;
  inventory_policy: string;
  inventory_quantity: number;
  compare_at_price_min: number;
  compare_at_price_max: number;
  meta: {
    author?: string;
    isbn?: string;
    format?: string;
    publisher?: string;
    binding?: string;
    condition?: string;
    [key: string]: any;
  };
  named_tags?: {
    author?: string[];
    [key: string]: string[] | undefined;
  };
}

export interface AlgoliaSearchResponse {
  hits: AlgoliaProduct[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
}

export interface AlgoliaFacetResponse {
  facetHits: {
    value: string;
    count: number;
  }[];
  exhaustiveFacetsCount: boolean;
  processingTimeMS: number;
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
    this.baseUrl = `https://${this.appId}-dsn.algolia.net/1/indexes`;
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

    const url = `${this.baseUrl}/${this.indexName}/query`;
    
    const requestBody: any = {
      query,
      page,
      hitsPerPage,
      attributesToRetrieve: [
        'objectID',
        'title',
        'handle',
        'body_html',
        'vendor',
        'product_type',
        'tags',
        'price',
        'price_min',
        'price_max',
        'image',
        'images',
        'meta',
        'named_tags',
        'variants_count',
        'inventory_quantity',
        'compare_at_price_min',
        'compare_at_price_max',
      ],
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
   * Get products by category/product_type
   */
  async getProductsByCategory(
    category: string,
    page: number = 0,
    hitsPerPage: number = 20,
  ): Promise<AlgoliaSearchResponse> {
    // Use facetFilters to filter by product_type
    const facetFilters = [[`product_type:${category}`]];
    return this.searchProducts('', page, hitsPerPage, undefined, facetFilters);
  }

  /**
   * Get all product categories (facet values)
   */
  async getCategories(): Promise<string[]> {
    await this.delay();

    const url = `${this.baseUrl}/${this.indexName}/facets/product_type/query`;
    
    try {
      this.logger.log('Fetching product categories from Algolia facets');
      
      const response = await axios.post<AlgoliaFacetResponse>(
        url,
        {
          query: '',
          maxFacetHits: 100,
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        },
      );

      const categories = response.data.facetHits.map((hit) => hit.value).filter(Boolean);
      this.logger.log(`Found ${categories.length} categories from Algolia facets`);
      return categories;
    } catch (error) {
      this.logger.error(`Failed to get categories from Algolia: ${error.message}`, error.stack);
      // Return fallback categories
      return [
        'Fiction',
        'Non-Fiction',
        "Children's Books",
        'Academic & Educational',
        'Biography',
        'Science Fiction',
        'Mystery & Crime',
        'History',
        'Self-Help',
        'Business & Economics',
      ];
    }
  }

  /**
   * Get a single product by handle or objectID
   */
  async getProductByHandle(handle: string): Promise<AlgoliaProduct | null> {
    await this.delay();

    try {
      // First try to get by objectID
      const url = `${this.baseUrl}/${this.indexName}/${encodeURIComponent(handle)}`;
      
      try {
        const response = await axios.get<AlgoliaProduct>(url, {
          headers: this.getHeaders(),
          timeout: 15000,
        });
        return response.data;
      } catch {
        // If not found by objectID, search by handle
        const searchResponse = await this.searchProducts('', 0, 1, `handle:${handle}`);
        return searchResponse.hits[0] || null;
      }
    } catch (error) {
      this.logger.error(`Failed to get product ${handle}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get related/similar products
   */
  async getRelatedProducts(productType: string, excludeHandle: string, limit: number = 6): Promise<AlgoliaProduct[]> {
    try {
      const response = await this.searchProducts(
        '',
        0,
        limit + 1,
        undefined,
        [[`product_type:${productType}`]],
      );
      
      // Filter out the current product and limit results
      return response.hits.filter((p) => p.handle !== excludeHandle).slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get related products: ${error.message}`);
      return [];
    }
  }

  /**
   * Browse all products with pagination (for scraping all products)
   */
  async browseAllProducts(
    page: number = 0,
    hitsPerPage: number = 100,
  ): Promise<AlgoliaSearchResponse> {
    return this.searchProducts('', page, hitsPerPage);
  }

  /**
   * Extract author from Algolia product
   */
  extractAuthor(product: AlgoliaProduct): string | null {
    // Check named_tags first
    if (product.named_tags?.author && product.named_tags.author.length > 0) {
      return product.named_tags.author[0];
    }
    // Check meta
    if (product.meta?.author) {
      return product.meta.author;
    }
    // Check vendor (sometimes used for author)
    if (product.vendor && product.vendor !== 'World of Books') {
      return product.vendor;
    }
    // Extract from tags
    const authorTag = product.tags?.find((tag) => tag.toLowerCase().startsWith('author:'));
    if (authorTag) {
      return authorTag.replace(/^author:/i, '').trim();
    }
    return null;
  }

  /**
   * Build product URL from handle
   */
  buildProductUrl(handle: string): string {
    return `https://www.worldofbooks.com/en-gb/products/${handle}`;
  }

  /**
   * Build category URL from product_type
   */
  buildCategoryUrl(productType: string): string {
    const slug = productType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `https://www.worldofbooks.com/en-gb/collections/${slug}`;
  }
}
