// backend/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Navigation } from '../entities/navigation.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductDetail } from '../entities/product-detail.entity';
import { Review } from '../entities/review.entity';
import { ScrapeJob } from '../entities/scrape-job.entity';
import { ViewHistory } from '../entities/view-history.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [
          Navigation,
          Category,
          Product,
          ProductDetail,
          Review,
          ScrapeJob,
          ViewHistory,
        ],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        // FIX: Use single SSL configuration for Neon
        ssl: { rejectUnauthorized: false }, 
      }),
    }),
  ],
})
export class DatabaseModule {}