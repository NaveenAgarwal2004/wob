// backend/src/scraper/scraper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PlaywrightCrawler, Dataset } from 'crawlee';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Navigation } from '../entities/navigation.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductDetail } from '../entities/product-detail.entity';
import { Review } from '../entities/review.entity';
import { ScrapeJob, ScrapeJobStatus, ScrapeTargetType } from '../entities/scrape-job.entity';
import { ConfigService } from '@nestjs/config';
import { AlgoliaService } from './algolia.service';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly BASE_URL = 'https://www.worldofbooks.com';
  private readonly DELAY_MS: number;
  private readonly MAX_RETRIES: number;

  constructor(
    @InjectRepository(Navigation)
    private navigationRepo: Repository<Navigation>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductDetail)
    private productDetailRepo: Repository<ProductDetail>,
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(ScrapeJob)
    private scrapeJobRepo: Repository<ScrapeJob>,
    private configService: ConfigService,
    private algoliaService: AlgoliaService,
  ) {
    this.DELAY_MS = parseInt(this.configService.get<string>('SCRAPE_DELAY_MS', '2000'));
    this.MAX_RETRIES = parseInt(this.configService.get<string>('SCRAPE_MAX_RETRIES', '3'));
  }

  /**
   * Scrape top-level navigation categories
   * Uses Algolia facets to get real categories
   */
  async scrapeNavigations(): Promise<Navigation[]> {
    const job = await this.createScrapeJob(`${this.BASE_URL}/en-gb`, ScrapeTargetType.NAVIGATION);

    try {
      await this.updateJobStatus(job.id, ScrapeJobStatus.IN_PROGRESS);
      this.logger.log('Starting navigation scrape via Algolia');

      // Use Algolia to get product_type facets (these are the main categories)
      const categories = await this.algoliaService.getCategories();

      if (categories.length === 0) {
        throw new Error('No categories found from Algolia');
      }

      // Create navigation entries for major category groups
      const navigationGroups = this.groupCategoriesIntoNavigations(categories);

      const navigations: Navigation[] = [];
      for (const [navTitle, categoryList] of Object.entries(navigationGroups)) {
        const slug = this.createSlug(navTitle);
        let nav = await this.navigationRepo.findOne({ where: [{ slug }, { title: navTitle }] });

        if (!nav) {
          nav = this.navigationRepo.create({
            title: navTitle,
            slug,
            sourceUrl: `${this.BASE_URL}/en-gb/collections/${slug}`,
            lastScrapedAt: new Date(),
          });
          this.logger.log(`Creating new navigation: ${navTitle}`);
        } else {
          nav.lastScrapedAt = new Date();
          this.logger.log(`Updating navigation: ${navTitle}`);
        }

        navigations.push(await this.navigationRepo.save(nav));
      }

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully created ${navigations.length} navigations from Algolia`);
      return navigations;
    } catch (error) {
      this.logger.error(`Error scraping navigations: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      throw error;
    }
  }

  /**
   * Group Algolia categories into logical navigation groups
   */
  private groupCategoriesIntoNavigations(categories: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {
      'Books': [],
      'Children\'s Books': [],
      'Non-Fiction': [],
      'Fiction': [],
      'Other': [],
    };

    for (const category of categories) {
      const lower = category.toLowerCase();
      if (lower.includes('child') || lower.includes('kid') || lower.includes('young')) {
        groups['Children\'s Books'].push(category);
      } else if (lower.includes('fiction') && !lower.includes('non')) {
        groups['Fiction'].push(category);
      } else if (lower.includes('non-fiction') || lower.includes('history') || lower.includes('biography')) {
        groups['Non-Fiction'].push(category);
      } else {
        groups['Books'].push(category);
      }
    }

    // Remove empty groups
    return Object.fromEntries(Object.entries(groups).filter(([_, cats]) => cats.length > 0));
  }

  /**
   * Scrape categories for a navigation using Algolia facets
   */
  async scrapeCategories(navigationId: string, force = false): Promise<Category[]> {
    const navigation = await this.navigationRepo.findOne({ where: { id: navigationId } });
    if (!navigation) {
      throw new Error(`Navigation not found: ${navigationId}`);
    }

    // Check cache
    if (!force && navigation.lastScrapedAt) {
      const cacheAge = Date.now() - navigation.lastScrapedAt.getTime();
      const cacheTTL = parseInt(this.configService.get<string>('CACHE_TTL_SECONDS', '3600')) * 1000;
      if (cacheAge < cacheTTL) {
        this.logger.log(`Using cached categories for navigation: ${navigation.title}`);
        return this.categoryRepo.find({ where: { navigationId } });
      }
    }

    const job = await this.createScrapeJob(navigation.sourceUrl, ScrapeTargetType.CATEGORY);

    try {
      await this.updateJobStatus(job.id, ScrapeJobStatus.IN_PROGRESS);
      this.logger.log(`Fetching categories for: ${navigation.title} via Algolia`);

      // Get all product_type facets from Algolia
      const allCategories = await this.algoliaService.getCategories();

      // Filter categories relevant to this navigation
      const relevantCategories = this.filterCategoriesForNavigation(navigation.title, allCategories);

      const categories: Category[] = [];
      for (const categoryName of relevantCategories.slice(0, 20)) {
        const slug = this.createSlug(categoryName);
        const categoryUrl = this.algoliaService.buildCategoryUrl(categoryName);

        let category = await this.categoryRepo.findOne({ where: { slug, navigationId } });

        if (!category) {
          category = this.categoryRepo.create({
            navigationId,
            title: categoryName,
            slug,
            sourceUrl: categoryUrl,
            lastScrapedAt: new Date(),
            productCount: 0,
          });
          this.logger.log(`Creating new category: ${categoryName}`);
        } else {
          category.lastScrapedAt = new Date();
          category.sourceUrl = categoryUrl;
          this.logger.log(`Updating category: ${categoryName}`);
        }

        categories.push(await this.categoryRepo.save(category));
      }

      navigation.lastScrapedAt = new Date();
      await this.navigationRepo.save(navigation);

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully fetched ${categories.length} categories`);
      return categories;
    } catch (error) {
      this.logger.error(`Error fetching categories: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      throw error;
    }
  }

  /**
   * Filter categories relevant to a specific navigation
   */
  private filterCategoriesForNavigation(navTitle: string, allCategories: string[]): string[] {
    const lower = navTitle.toLowerCase();
    
    if (lower.includes('child')) {
      return allCategories.filter(c => 
        c.toLowerCase().includes('child') || 
        c.toLowerCase().includes('kid') ||
        c.toLowerCase().includes('young')
      );
    }
    
    if (lower === 'fiction') {
      return allCategories.filter(c => 
        c.toLowerCase().includes('fiction') && 
        !c.toLowerCase().includes('non')
      );
    }
    
    if (lower.includes('non-fiction')) {
      return allCategories.filter(c => 
        c.toLowerCase().includes('non-fiction') ||
        c.toLowerCase().includes('history') ||
        c.toLowerCase().includes('biography')
      );
    }
    
    // Default: return all categories
    return allCategories;
  }

  /**
   * Scrape products from Algolia API for a category
   * This is the CRITICAL method that was failing
   */
  async scrapeProducts(
    categoryId: string,
    page = 1,
    limit = 20,
    force = false
  ): Promise<{ products: Product[]; total: number }> {
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    // Check cache
    if (!force && category.lastScrapedAt) {
      const cacheAge = Date.now() - category.lastScrapedAt.getTime();
      const cacheTTL = parseInt(this.configService.get<string>('CACHE_TTL_SECONDS', '3600')) * 1000;
      if (cacheAge < cacheTTL) {
        this.logger.log(`Using cached products for category: ${category.title}`);
        const [products, total] = await this.productRepo.findAndCount({
          where: { categoryId },
          skip: (page - 1) * limit,
          take: limit,
          order: { title: 'ASC' },
        });
        return { products, total };
      }
    }

    const job = await this.createScrapeJob(category.sourceUrl || '', ScrapeTargetType.PRODUCT);

    try {
      await this.updateJobStatus(job.id, ScrapeJobStatus.IN_PROGRESS);
      this.logger.log(`Fetching products for category: ${category.title} from Algolia`);

      // FIX: Use getProductsByCategory which uses facetFilters correctly
      const algoliaResponse = await this.algoliaService.getProductsByCategory(
        category.title,
        page - 1, // Algolia uses 0-based indexing
        limit
      );

      this.logger.log(`Algolia returned ${algoliaResponse.hits.length} products for "${category.title}"`);

      const products: Product[] = [];
      for (const hit of algoliaResponse.hits) {
        try {
          const sourceId = hit.objectID;
          const sourceUrl = this.algoliaService.buildProductUrl(hit.productHandle);

          // Extract fields using AlgoliaService helpers
          const title = this.algoliaService.extractTitle(hit);
          const author = this.algoliaService.extractAuthor(hit) || 'Unknown Author';
          const price = this.algoliaService.extractPrice(hit);
          const imageUrl = this.algoliaService.extractImageUrl(hit);

          // FIX: Use upsert pattern to avoid duplicates
          let product = await this.productRepo.findOne({ where: { sourceId } });

          if (!product) {
            product = this.productRepo.create({
              sourceId,
              title,
              author,
              price: price ? parseFloat(price.toString()) : null,
              currency: 'GBP',
              imageUrl,
              sourceUrl,
              categoryId,
              lastScrapedAt: new Date(),
            });
            this.logger.debug(`Creating new product: ${title}`);
          } else {
            product.title = title;
            product.author = author;
            product.price = price ? parseFloat(price.toString()) : product.price;
            product.imageUrl = imageUrl;
            product.categoryId = categoryId;
            product.lastScrapedAt = new Date();
            this.logger.debug(`Updating product: ${title}`);
          }

          products.push(await this.productRepo.save(product));
        } catch (productError) {
          this.logger.error(`Failed to process product ${hit.objectID}: ${productError.message}`);
          continue; // Skip this product and continue with others
        }
      }

      // Update category metadata
      category.productCount = algoliaResponse.nbHits;
      category.lastScrapedAt = new Date();
      await this.categoryRepo.save(category);

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully scraped ${products.length} products (total available: ${algoliaResponse.nbHits})`);

      return { products, total: algoliaResponse.nbHits };
    } catch (error) {
      this.logger.error(`Algolia scraping failed for category ${category.title}: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      
      // FIX: Return cached data on error instead of empty result
      this.logger.warn('Attempting to return cached products due to error');
      const [products, total] = await this.productRepo.findAndCount({
        where: { categoryId },
        skip: (page - 1) * limit,
        take: limit,
        order: { title: 'ASC' },
      });
      
      return { products, total };
    }
  }

  /**
   * Scrape product details using Playwright (for rich content like reviews)
   */
  async scrapeProductDetail(productId: string, force = false): Promise<ProductDetail> {
    const product = await this.productRepo.findOne({ 
      where: { id: productId },
      relations: ['detail'] 
    });
    
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Use existing detail if fresh (< 24h)
    if (!force && product.lastScrapedAt && product.detail) {
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - product.lastScrapedAt.getTime() < oneDay) {
        this.logger.log(`Using cached detail for product: ${product.title}`);
        return product.detail;
      }
    }

    const job = await this.createScrapeJob(product.sourceUrl, ScrapeTargetType.PRODUCT_DETAIL);

    try {
      await this.updateJobStatus(job.id, ScrapeJobStatus.IN_PROGRESS);
      this.logger.log(`Scraping detail for product: ${product.title}`);

      const crawler = new PlaywrightCrawler({
        requestHandlerTimeoutSecs: 30,
        maxRequestRetries: this.MAX_RETRIES,
        launchContext: {
          launchOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
        },
        preNavigationHooks: [async () => await this.randomDelay()],
        requestHandler: async ({ page, log }) => {
          try {
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            
            const data = await page.evaluate(() => {
              const description = document.querySelector('.product-description, #description, .description, [itemprop="description"]')?.textContent?.trim() || 'No description available.';
              
              const reviewCountEl = document.querySelector('.review-count, .stars .count, [itemprop="reviewCount"]');
              const reviewCount = reviewCountEl ? parseInt(reviewCountEl.textContent?.replace(/\D/g, '') || '0') : 0;
              
              const ratingEl = document.querySelector('.rating-value, .stars .value, [itemprop="ratingValue"]');
              const ratingsAvg = ratingEl ? parseFloat(ratingEl.textContent?.trim() || '0') : 0;

              const specs: Record<string, string> = {};
              document.querySelectorAll('table.specs tr, .product-attributes li, .product-details dt').forEach(row => {
                const key = row.querySelector('th, strong, dt')?.textContent?.replace(':', '').trim();
                const val = row.querySelector('td, span, dd')?.textContent?.trim();
                if (key && val) specs[key] = val;
              });

              return { description, reviewCount, ratingsAvg, specs };
            });

            await Dataset.pushData(data);
          } catch (evalError) {
            log.error(`Failed to evaluate page: ${evalError.message}`);
            await Dataset.pushData({ 
              description: 'Failed to load description', 
              reviewCount: 0, 
              ratingsAvg: 0, 
              specs: {} 
            });
          }
        },
        failedRequestHandler: async ({ request, log }, error) => {
          log.error(`Request failed for ${request.url}: ${error.message}`);
        },
      });

      await crawler.run([product.sourceUrl]);
      const dataset = await Dataset.getData();
      const data = dataset.items[0] || {};

      // Upsert ProductDetail
      let detail = await this.productDetailRepo.findOne({ where: { productId } });
      if (!detail) {
        detail = this.productDetailRepo.create({
          productId,
          description: data.description || 'No description available',
          reviewsCount: data.reviewCount || 0,
          ratingsAvg: data.ratingsAvg || null,
          specs: data.specs || {},
          recommendations: [],
        });
        this.logger.log(`Creating new product detail for: ${product.title}`);
      } else {
        detail.description = data.description || detail.description;
        detail.reviewsCount = data.reviewCount || detail.reviewsCount;
        detail.ratingsAvg = data.ratingsAvg || detail.ratingsAvg;
        detail.specs = data.specs || detail.specs;
        this.logger.log(`Updating product detail for: ${product.title}`);
      }

      await this.productDetailRepo.save(detail);
      
      // Update product timestamp
      product.lastScrapedAt = new Date();
      await this.productRepo.save(product);

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully scraped detail for: ${product.title}`);
      
      return detail;
    } catch (error) {
      this.logger.error(`Failed to scrape detail for ${product.title}: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      
      // Return existing detail or create minimal one
      if (product.detail) {
        return product.detail;
      }
      
      const minimalDetail = this.productDetailRepo.create({
        productId,
        description: 'Failed to load description',
        reviewsCount: 0,
        ratingsAvg: null,
        specs: {},
        recommendations: [],
      });
      
      return this.productDetailRepo.save(minimalDetail);
    }
  }

  // Helper methods
  private async createScrapeJob(targetUrl: string, targetType: ScrapeTargetType): Promise<ScrapeJob> {
    const job = this.scrapeJobRepo.create({
      targetUrl,
      targetType,
      status: ScrapeJobStatus.PENDING,
    });
    return this.scrapeJobRepo.save(job);
  }

  private async updateJobStatus(jobId: string, status: ScrapeJobStatus, errorLog?: string): Promise<void> {
    const job = await this.scrapeJobRepo.findOne({ where: { id: jobId } });
    if (!job) return;

    job.status = status;
    if (status === ScrapeJobStatus.IN_PROGRESS) job.startedAt = new Date();
    if (status === ScrapeJobStatus.COMPLETED || status === ScrapeJobStatus.FAILED) {
      job.finishedAt = new Date();
    }
    if (errorLog) job.errorLog = errorLog;

    await this.scrapeJobRepo.save(job);
  }

  createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async randomDelay(): Promise<void> {
    const delay = this.DELAY_MS + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}