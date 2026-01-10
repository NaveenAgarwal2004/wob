import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScraperService } from './scraper.service';
import { ScraperProcessor } from './scraper.processor';
import { CacheService } from './cache.service';
import { AlgoliaService } from './algolia.service';
import { Navigation } from '../entities/navigation.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductDetail } from '../entities/product-detail.entity';
import { Review } from '../entities/review.entity';
import { ScrapeJob } from '../entities/scrape-job.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Navigation,
      Category,
      Product,
      ProductDetail,
      Review,
      ScrapeJob,
    ]),
    BullModule.registerQueue({
      name: 'scrape-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [ScraperService, ScraperProcessor, CacheService, AlgoliaService],
  exports: [ScraperService, CacheService, AlgoliaService],
})
export class ScraperModule {}
