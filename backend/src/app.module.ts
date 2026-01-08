// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { ScraperModule } from './scraper/scraper.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NavigationController } from './controllers/navigation.controller';
import { CategoryController } from './controllers/category.controller';
import { ProductController } from './controllers/product.controller';
import { ViewHistoryController } from './controllers/view-history.controller';
import { NavigationService } from './services/navigation.service';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { ViewHistoryService } from './services/view-history.service';
import { Navigation } from './entities/navigation.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ViewHistory } from './entities/view-history.entity';
import { ScrapeJob } from './entities/scrape-job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    // Rate limiting configuration
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per minute
    }]),
    // Initialize the Scrape Queue with Upstash Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          // Essential for Upstash stability
          maxRetriesPerRequest: null,
          tls: {}, 
        },
      }),
    }),
    // Register the scrape queue
    BullModule.registerQueue({
      name: 'scrape-queue',
    }),
    // Import entities for TypeORM
    TypeOrmModule.forFeature([Navigation, Category, Product, ViewHistory, ScrapeJob]),
    ScraperModule,
  ],
  controllers: [
    AppController,
    NavigationController, 
    CategoryController, 
    ProductController, 
    ViewHistoryController,
  ],
  providers: [
    AppService,
    NavigationService, 
    CategoryService, 
    ProductService, 
    ViewHistoryService,
  ],
})
export class AppModule {}