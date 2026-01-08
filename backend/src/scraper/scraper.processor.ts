import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';

export interface ScrapeJobData {
  type: 'navigation' | 'category' | 'product' | 'product_detail';
  id?: string;
  force?: boolean;
  page?: number;
  limit?: number;
}

@Processor('scrape-queue')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(private readonly scraperService: ScraperService) {
    super();
  }

  async process(job: Job<ScrapeJobData>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type: ${job.data.type}`);

    try {
      switch (job.data.type) {
        case 'navigation':
          return await this.handleNavigationScrape(job);
        case 'category':
          return await this.handleCategoryScrape(job);
        case 'product':
          return await this.handleProductScrape(job);
        case 'product_detail':
          return await this.handleProductDetailScrape(job);
        default:
          throw new Error(`Unknown job type: ${job.data.type}`);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleNavigationScrape(job: Job<ScrapeJobData>) {
    this.logger.log(`Processing navigation scrape job ${job.id}`);
    const result = await this.scraperService.scrapeNavigations();
    return { success: true, count: result.length };
  }

  private async handleCategoryScrape(job: Job<ScrapeJobData>) {
    this.logger.log(`Processing category scrape job ${job.id}`);
    if (!job.data.id) {
      throw new Error('Navigation ID is required for category scrape');
    }
    const result = await this.scraperService.scrapeCategories(job.data.id, job.data.force);
    return { success: true, count: result.length };
  }

  private async handleProductScrape(job: Job<ScrapeJobData>) {
    this.logger.log(`Processing product scrape job ${job.id}`);
    if (!job.data.id) {
      throw new Error('Category ID is required for product scrape');
    }
    const result = await this.scraperService.scrapeProducts(
      job.data.id,
      job.data.page || 1,
      job.data.limit || 20,
      job.data.force,
    );
    return { success: true, count: result.products.length, total: result.total };
  }

  private async handleProductDetailScrape(job: Job<ScrapeJobData>) {
    this.logger.log(`Processing product detail scrape job ${job.id}`);
    if (!job.data.id) {
      throw new Error('Product ID is required for product detail scrape');
    }
    const result = await this.scraperService.scrapeProductDetail(job.data.id, job.data.force);
    return { success: true, detail: result };
  }
}
