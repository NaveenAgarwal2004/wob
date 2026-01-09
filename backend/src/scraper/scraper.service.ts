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
      this.logger.log(`Starting category scrape for: ${navigation.title}`);

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
        requestHandler: async ({ page, log }) => {
          await page.waitForLoadState('networkidle', { timeout: 30000 });

          const categoryItems = await page.evaluate(() => {
            const items: { title: string; url: string }[] = [];

            // Shopify collection/category patterns
            const selectors = [
              '.collection-filters a',
              '.facets a',
              '.sidebar a[href*="/collections/"]',
              'aside a[href*="/collections/"]',
              '.site-footer__linklist a[href*="/collections/"]',
              'a[href*="/en-gb/category/"]',
            ];

            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                elements.forEach((el: Element) => {
                  const anchor = el as HTMLAnchorElement;
                  const title = anchor.textContent?.trim();
                  const url = anchor.href;
                  if (title && url && !items.find((i) => i.url === url)) {
                    items.push({ title, url });
                  }
                });
              }
            }

            return items;
          });

          await Dataset.pushData({ categoryItems });
        },
      });

      await crawler.run([navigation.sourceUrl]);

      const dataset = await Dataset.getData();
      let categoryItems = dataset.items[0]?.categoryItems || [];

      // Fallback: create generic categories for this navigation
      if (categoryItems.length === 0) {
        this.logger.warn('No category items found via scraping, using fallback categories');
        categoryItems = [
          { title: `${navigation.title} - Featured`, url: `${navigation.sourceUrl}?sort=featured` },
          { title: `${navigation.title} - New Arrivals`, url: `${navigation.sourceUrl}?sort=new` },
          { title: `${navigation.title} - Best Sellers`, url: `${navigation.sourceUrl}?sort=bestselling` },
        ];
      }

      const categories: Category[] = [];
      for (const item of categoryItems) {
        const slug = this.createSlug(item.title);
        let category = await this.categoryRepo.findOne({ where: { slug, navigationId } });

        if (!category) {
          category = this.categoryRepo.create({
            navigationId,
            title: item.title,
            slug,
            sourceUrl: item.url,
            lastScrapedAt: new Date(),
          });
          this.logger.log(`Creating new category: ${item.title}`);
        } else {
          category.lastScrapedAt = new Date();
          category.sourceUrl = item.url;
          this.logger.log(`Updating category: ${item.title}`);
        }

        categories.push(await this.categoryRepo.save(category));
      }

      // Update navigation last scraped
      navigation.lastScrapedAt = new Date();
      await this.navigationRepo.save(navigation);

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully scraped ${categories.length} categories`);
      return categories;
    } catch (error) {
      this.logger.error(`Error scraping categories: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      throw error;
    } finally {
      // Dataset cleanup handled automatically
    }
  }

  async scrapeProducts(
    categoryId: string,
    page = 1,
    limit = 20,
    force = false,
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
        });
        return { products, total };
      }
    }

    const url = `${category.sourceUrl}${category.sourceUrl.includes('?') ? '&' : '?'}page=${page}`;
    const job = await this.createScrapeJob(url, ScrapeTargetType.PRODUCT);

    try {
      await this.updateJobStatus(job.id, ScrapeJobStatus.IN_PROGRESS);
      this.logger.log(`Starting product scrape for category: ${category.title}, page: ${page}`);

      const crawler = new PlaywrightCrawler({
        requestHandlerTimeoutSecs: 90,
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
        requestHandler: async ({ page: browserPage, log }) => {
          await browserPage.waitForLoadState('networkidle', { timeout: 30000 });

          const productItems = await browserPage.evaluate(() => {
            const items: {
              title: string;
              author: string;
              price: string;
              imageUrl: string;
              url: string;
            }[] = [];

            // Shopify product card patterns for WoB
            const cardSelectors = [
              '.product-card',
              '.product-item',
              'div.product',
              '.grid--uniform > div',
              '.collection .product',
              'article.product',
            ];

            for (const cardSelector of cardSelectors) {
              const cards = document.querySelectorAll(cardSelector);
              if (cards.length > 0) {
                cards.forEach((card: Element) => {
                  const titleEl = card.querySelector(
                    '.product-card__title, .product__title, h3, h2, .title, a.product-link'
                  );
                  const authorEl = card.querySelector(
                    '.product-meta__author, .author, .product__vendor, .by-line'
                  );
                  const priceEl = card.querySelector(
                    '.price-item, .product__price, .price, .money'
                  );
                  const imageEl = card.querySelector('img');
                  const linkEl = card.querySelector('a[href*="/products/"], a.product-card__link');

                  const title = titleEl?.textContent?.trim() || '';
                  const url = (linkEl as HTMLAnchorElement)?.href || (card as HTMLElement)?.closest('a')?.href || '';

                  if (title && url && !items.find((i) => i.url === url)) {
                    items.push({
                      title,
                      author: authorEl?.textContent?.trim() || '',
                      price: priceEl?.textContent?.trim() || '',
                      imageUrl:
                        (imageEl as HTMLImageElement)?.src ||
                        (imageEl as HTMLImageElement)?.dataset?.src ||
                        '',
                      url,
                    });
                  }
                });
                break;
              }
            }

            return items;
          });

          await Dataset.pushData({ productItems });
        },
      });

      await crawler.run([url]);

      const dataset = await Dataset.getData();
      const productItems = dataset.items[0]?.productItems || [];

      const products: Product[] = [];
      for (const item of productItems) {
        if (!item.url) continue;

        const sourceId = this.extractSourceId(item.url);
        let product = await this.productRepo.findOne({ where: { sourceId } });

        const priceValue = this.parsePrice(item.price);

        if (!product) {
          product = this.productRepo.create({
            sourceId,
            title: item.title,
            author: item.author || null,
            price: priceValue,
            imageUrl: item.imageUrl || null,
            sourceUrl: item.url,
            categoryId,
            lastScrapedAt: new Date(),
          });
          this.logger.log(`Creating new product: ${item.title}`);
        } else {
          product.title = item.title;
          product.author = item.author || product.author;
          product.price = priceValue ?? product.price;
          product.imageUrl = item.imageUrl || product.imageUrl;
          product.categoryId = categoryId;
          product.lastScrapedAt = new Date();
          this.logger.log(`Updating product: ${item.title}`);
        }

        products.push(await this.productRepo.save(product));
      }

      // Update category metadata
      const totalProducts = await this.productRepo.count({ where: { categoryId } });
      category.productCount = totalProducts;
      category.lastScrapedAt = new Date();
      await this.categoryRepo.save(category);

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully scraped ${products.length} products`);

      return { products, total: totalProducts };
    } catch (error) {
      this.logger.error(`Error scraping products: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      throw error;
    } finally {
      // Dataset cleanup handled automatically
    }
  }

  async scrapeProductDetail(productId: string, force = false): Promise<ProductDetail> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['detail'],
    });

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Check cache
    if (!force && product.lastScrapedAt) {
      const cacheAge = Date.now() - product.lastScrapedAt.getTime();
      const cacheTTL = parseInt(this.configService.get<string>('CACHE_TTL_SECONDS', '3600')) * 1000;
      if (cacheAge < cacheTTL && product.detail) {
        this.logger.log(`Using cached detail for product: ${product.title}`);
        return product.detail;
      }
    }

    const job = await this.createScrapeJob(product.sourceUrl, ScrapeTargetType.PRODUCT_DETAIL);

    try {
      await this.updateJobStatus(job.id, ScrapeJobStatus.IN_PROGRESS);
      this.logger.log(`Starting detail scrape for product: ${product.title}`);

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
        requestHandler: async ({ page, log }) => {
          await page.waitForLoadState('networkidle', { timeout: 30000 });

          const detailData = await page.evaluate(() => {
            const description =
              document.querySelector(
                '.product__description, .product-description, .description, .product__text'
              )?.textContent?.trim() || null;
            const rating =
              document.querySelector(
                '.rating-value, [itemprop="ratingValue"], .stars-value, .product__rating'
              )?.textContent?.trim() || null;
            const reviewCount =
              document.querySelector(
                '.review-count, [itemprop="reviewCount"], .reviews-count, .product__review-count'
              )?.textContent?.trim() || null;

            const reviews = Array.from(
              document.querySelectorAll('.review-item, .review, .customer-review, .product-review')
            ).map((review: Element) => ({
              author:
                (review.querySelector('.review-author, .author, .reviewer-name') as HTMLElement)?.textContent?.trim() ||
                'Anonymous',
              rating: (review.querySelector('.review-rating, .rating, .stars') as HTMLElement)?.textContent?.trim() || '0',
              text:
                (review.querySelector('.review-text, .text, .review-body, .review-content') as HTMLElement)?.textContent?.trim() ||
                '',
            }));

            const recommendations = Array.from(
              document.querySelectorAll('.recommended-product a, .related-product a, .product-recommendations a')
            )
              .map((el: Element) => (el as HTMLAnchorElement).href)
              .filter(Boolean);

            const specs: Record<string, string> = {};
            document
              .querySelectorAll('.product-specs tr, .product__details tr, .product-info tr, dl.product__details dt')
              .forEach((row: Element) => {
                const label = (row.querySelector('th, .label, dt') as HTMLElement)?.textContent?.trim();
                const value = (row.querySelector('td, .value, dd') as HTMLElement)?.textContent?.trim();
                if (label && value) specs[label] = value;
              });

            return { description, rating, reviewCount, reviews, recommendations, specs };
          });

          await Dataset.pushData(detailData);
        },
      });

      await crawler.run([product.sourceUrl]);

      const dataset = await Dataset.getData();
      const detailData = dataset.items[0] || {};

      // Save product detail
      let productDetail = await this.productDetailRepo.findOne({ where: { productId } });

      if (!productDetail) {
        productDetail = this.productDetailRepo.create({
          productId,
          description: detailData.description,
          ratingsAvg: this.parseRating(detailData.rating),
          reviewsCount: parseInt(detailData.reviewCount) || 0,
          specs: detailData.specs || {},
          recommendations: detailData.recommendations || [],
        });
      } else {
        productDetail.description = detailData.description || productDetail.description;
        productDetail.ratingsAvg = this.parseRating(detailData.rating) ?? productDetail.ratingsAvg;
        productDetail.reviewsCount = parseInt(detailData.reviewCount) || productDetail.reviewsCount;
        productDetail.specs = detailData.specs || productDetail.specs;
        productDetail.recommendations = detailData.recommendations || productDetail.recommendations;
      }

      await this.productDetailRepo.save(productDetail);

      // Save reviews with deduplication
      if (detailData.reviews && detailData.reviews.length > 0) {
        await this.reviewRepo.delete({ productId });

        for (const reviewData of detailData.reviews) {
          if (reviewData.text) {
            const review = this.reviewRepo.create({
              productId,
              author: reviewData.author,
              rating: parseInt(reviewData.rating) || 0,
              text: reviewData.text,
            });
            await this.reviewRepo.save(review);
          }
        }
        this.logger.log(`Saved ${detailData.reviews.length} reviews for product: ${product.title}`);
      }

      // Update product last scraped
      product.lastScrapedAt = new Date();
      await this.productRepo.save(product);

      await this.updateJobStatus(job.id, ScrapeJobStatus.COMPLETED);
      this.logger.log(`Successfully scraped detail for product: ${product.title}`);

      return productDetail;
    } catch (error) {
      this.logger.error(`Error scraping product detail: ${error.message}`, error.stack);
      await this.updateJobStatus(job.id, ScrapeJobStatus.FAILED, error.message);
      throw error;
    } finally {
      // Dataset cleanup handled automatically
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
