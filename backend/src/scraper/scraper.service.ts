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

  async scrapeNavigations(): Promise<Navigation[]> {
    const url = `${this.BASE_URL}/en-gb`;
    const job = await this.createScrapeJob(url, ScrapeTargetType.NAVIGATION);

    try {
      await this.updateJobStatus(job.id, ScrapeJobStatus.IN_PROGRESS);
      this.logger.log('Starting navigation scrape');

      const crawler = new PlaywrightCrawler({
        requestHandlerTimeoutSecs: 60,
        maxRequestRetries: this.MAX_RETRIES,
        launchContext: {
          launchOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
        },
        preNavigationHooks: [
          async () => {
            await this.randomDelay();
          },
        ],
        requestHandler: async ({ page, request, log }) => {
          log.info(`Scraping navigations from: ${request.url}`);

          await page.waitForLoadState('networkidle', { timeout: 30000 });

          // Shopify-specific selectors for World of Books navigation
          const navItems = await page.evaluate(() => {
            const items: { title: string; url: string }[] = [];

            // Shopify patterns for WoB
            const selectors = [
              'nav.site-navigation a[href*="/collections/"]',
              'ul.site-nav a[href*="/collections/"]',
              '.site-nav__link[href*="/collections/"]',
              'header a[href*="/collections/"]',
              'nav a[href*="/en-gb/category/"]',
              '.header-wrapper a[href*="/collections/"]',
            ];

            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                elements.forEach((el: Element) => {
                  const anchor = el as HTMLAnchorElement;
                  const title = anchor.textContent?.trim();
                  const url = anchor.href;
                  if (
                    title &&
                    url &&
                    !title.match(/cart|search|account|login|register/i) &&
                    !items.find((i) => i.url === url)
                  ) {
                    items.push({ title, url });
                  }
                });
              }
            }

            return items;
          });

          await Dataset.pushData({ navItems });
        },
        failedRequestHandler: async ({ request, log }, error) => {
          log.error(`Request failed: ${request.url}`, { error: error.message });
        },
      });

      await crawler.run([url]);

      const dataset = await Dataset.getData();
      let navItems = dataset.items[0]?.navItems || [];

      // Hybrid approach: if no items found, use fallback categories
      if (navItems.length === 0) {
        this.logger.warn('No navigation items found via scraping, using fallback categories');
        navItems = [
          { title: 'Books', url: `${this.BASE_URL}/en-gb/category/books-bo` },
          { title: "Children's Books", url: `${this.BASE_URL}/en-gb/category/childrens-books-cb` },
          { title: 'Fiction', url: `${this.BASE_URL}/en-gb/category/fiction-f` },
          { title: 'Non-Fiction', url: `${this.BASE_URL}/en-gb/category/non-fiction-n` },
          { title: 'Academic & Educational', url: `${this.BASE_URL}/en-gb/category/academic-educational-ae` },
        ];
      }

      // Save to database with deduplication
      const navigations: Navigation[] = [];
      for (const item of navItems) {
        const slug = this.createSlug(item.title);

        let nav = await this.navigationRepo.findOne({
          where: [{ slug }, { title: item.title }],
        });

        if (!nav) {
          nav = this.navigationRepo.create({
            title: item.title,
            slug,
            sourceUrl: item.url,
            lastScrapedAt: new Date(),
          });
          this.logger.log(`Creating new navigation: ${item.title}`);
        } else {
          nav.lastScrapedAt = new Date();
          nav.sourceUrl = item.url;
          this.logger.log(`Updating navigation: ${item.title}`);
        }

        navigations.push(await this.navigationRepo.save(nav));
      }

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully scraped ${navigations.length} navigations`);
      return navigations;
    } catch (error) {
      this.logger.error(`Error scraping navigations: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      throw error;
    } finally {
      // Dataset cleanup handled automatically
    }
  }

  async scrapeCategories(navigationId: string, force = false): Promise<Category[]> {
    const navigation = await this.navigationRepo.findOne({ where: { id: navigationId } });
    if (!navigation) {
      throw new Error(`Navigation not found: ${navigationId}`);
    }

    // Check cache unless forced
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
      this.logger.log(`Fetching categories for: ${navigation.title} via Algolia facets`);

      // Use Algolia to get real categories from product_type facets
      const categoryNames = await this.algoliaService.getCategories();

      const categories: Category[] = [];
      for (const categoryName of categoryNames.slice(0, 20)) { // Limit to 20 categories per navigation
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
            productCount: 0, // Will be updated when products are scraped
          });
          this.logger.log(`Creating new category: ${categoryName}`);
        } else {
          category.lastScrapedAt = new Date();
          category.sourceUrl = categoryUrl;
          this.logger.log(`Updating category: ${categoryName}`);
        }

        categories.push(await this.categoryRepo.save(category));
      }

      // Update navigation last scraped
      navigation.lastScrapedAt = new Date();
      await this.navigationRepo.save(navigation);

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully fetched ${categories.length} categories from Algolia`);
      return categories;
    } catch (error) {
      this.logger.error(`Error fetching categories: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      throw error;
    }
  }


async scrapeProducts(categoryId: string, page = 1, limit = 20, force = false): Promise<{ products: Product[]; total: number }> {
  const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
  if (!category) {
    throw new Error(`Category not found: ${categoryId}`);
  }

  // Check cache unless forced
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
    this.logger.log(`Fetching products for category: ${category.title} via Algolia API`);

    // Use AlgoliaService to search products by category title
    const searchQuery = category.title;
    const algoliaResponse = await this.algoliaService.searchProducts(
      searchQuery,
      page - 1, // Algolia uses 0-based pagination
      limit,
    );

    const products: Product[] = [];
    for (const hit of algoliaResponse.hits) {
      const sourceId = hit.objectID;
      const sourceUrl = this.algoliaService.buildProductUrl(hit.handle);

      let product = await this.productRepo.findOne({ where: { sourceId } });

      // Extract author using AlgoliaService helper
      const author = this.algoliaService.extractAuthor(hit);
      
      // Use price_min which is more reliable
      const price = hit.price_min || hit.price || 0;

      if (!product) {
        product = this.productRepo.create({
          sourceId,
          title: hit.title,
          author: author || 'Unknown Author',
          price: price,
          currency: 'GBP',
          imageUrl: hit.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
          sourceUrl,
          categoryId,
          lastScrapedAt: new Date(),
        });
        this.logger.log(`Creating new product: ${hit.title}`);
      } else {
        product.title = hit.title;
        product.author = author || product.author;
        product.price = price;
        product.imageUrl = hit.image || product.imageUrl;
        product.lastScrapedAt = new Date();
        this.logger.log(`Updating product: ${hit.title}`);
      }

      products.push(await this.productRepo.save(product));
    }

    // Update category metadata
    category.productCount = algoliaResponse.nbHits;
    category.lastScrapedAt = new Date();
    await this.categoryRepo.save(category);

    await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
    this.logger.log(`Successfully scraped ${products.length} products (total: ${algoliaResponse.nbHits})`);

    return { products, total: algoliaResponse.nbHits };
  } catch (error) {
    this.logger.error(`Algolia scraping failed: ${error.message}`, error.stack);
    await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
    
    // Return empty result on failure
    return { products: [], total: 0 };
  }
}

// REPLACE scrapeProductDetail with this Hybrid implementation
async scrapeProductDetail(productId: string, force = false): Promise<ProductDetail> {
  const product = await this.productRepo.findOne({ 
    where: { id: productId },
    relations: ['detail'] 
  });
  
  if (!product) throw new Error(`Product not found: ${productId}`);

  // Use existing detail if fresh (< 24h)
  if (!force && product.lastScrapedAt && product.detail) {
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - product.lastScrapedAt.getTime() < oneDay) {
      return product.detail;
    }
  }

  // Use Playwright for the detail page as it has rich text (Reviews, Description)
  const job = await this.createScrapeJob(product.sourceUrl, ScrapeTargetType.PRODUCT_DETAIL);
  await this.updateJobStatus(job.id, ScrapeJobStatus.IN_PROGRESS);

  try {
    const crawler = new PlaywrightCrawler({
      // We only need 1 page, so be aggressive with timeouts
      requestHandlerTimeoutSecs: 30, 
      requestHandler: async ({ page }) => {
        // Wait for description to verify page load
        try {
          await page.waitForSelector('.product-description, .description', { timeout: 10000 });
        } catch (e) {
          this.logger.warn(`Description selector not found for ${product.sourceUrl}`);
        }

        const data = await page.evaluate(() => {
          // Robust selectors for WoB detail page
          const description = document.querySelector('.product-description, #description, .description')?.textContent?.trim() || 'No description available.';
          
          // Reviews often load dynamically or might be missing
          const reviewCountText = document.querySelector('.review-count, .stars .count')?.textContent || '0';
          const reviewCount = parseInt(reviewCountText.replace(/\D/g, '')) || 0;
          
          const ratingText = document.querySelector('.rating-value, .stars .value')?.textContent || '0';
          const ratingsAvg = parseFloat(ratingText) || 0;

          // Extract basic table specs
          const specs: Record<string, string> = {};
          document.querySelectorAll('table.specs tr, .product-attributes li').forEach(row => {
            const key = row.querySelector('th, strong')?.textContent?.replace(':', '').trim();
            const val = row.querySelector('td, span')?.textContent?.trim();
            if (key && val) specs[key] = val;
          });

          return { description, reviewCount, ratingsAvg, specs };
        });

        await Dataset.pushData(data);
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
        description: data.description,
        reviewsCount: data.reviewCount,
        ratingsAvg: data.ratingsAvg,
        specs: data.specs,
        recommendations: [] // Recommendations are heavy, skip for MVP
      });
    } else {
      detail.description = data.description;
      detail.reviewsCount = data.reviewCount;
      detail.ratingsAvg = data.ratingsAvg;
      detail.specs = data.specs;
    }

    await this.productDetailRepo.save(detail);
    
    // Mark job complete
    await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
    
    return detail;

  } catch (error) {
    this.logger.error(`Failed to scrape detail: ${error.message}`);
    await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
    throw error;
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

  private extractSourceId(url: string): string {
    const match = url.match(/\/([^\/]+)\/?$/);
    return match ? match[1] : `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private parsePrice(priceText: string): number | null {
    if (!priceText) return null;
    const match = priceText.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  private parseRating(ratingText: string | null): number | null {
    if (!ratingText) return null;
    const match = ratingText.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  private async randomDelay(): Promise<void> {
    const delay = this.DELAY_MS + Math.random() * 1000;
    this.logger.debug(`Waiting ${Math.round(delay)}ms before next request`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
