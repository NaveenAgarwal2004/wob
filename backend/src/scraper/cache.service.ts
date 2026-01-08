import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Navigation } from '../entities/navigation.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly CACHE_TTL_SECONDS: number;

  constructor(
    @InjectRepository(Navigation)
    private navigationRepo: Repository<Navigation>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private configService: ConfigService,
  ) {
    this.CACHE_TTL_SECONDS = this.configService.get<number>('CACHE_TTL_SECONDS', 3600);
  }

  async shouldScrapeNavigation(): Promise<boolean> {
    const count = await this.navigationRepo.count();
    if (count === 0) return true;

    const staleThreshold = new Date(Date.now() - this.CACHE_TTL_SECONDS * 1000);
    const recentNav = await this.navigationRepo.findOne({
      where: {
        lastScrapedAt: LessThan(staleThreshold),
      },
      order: { lastScrapedAt: 'DESC' },
    });
    return !!recentNav;
  }

  async shouldScrapeCategory(categoryId: string): Promise<boolean> {
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!category || !category.lastScrapedAt) return true;

    const age = Date.now() - category.lastScrapedAt.getTime();
    return age > this.CACHE_TTL_SECONDS * 1000;
  }

  async shouldScrapeProduct(productId: string): Promise<boolean> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product || !product.lastScrapedAt) return true;

    const age = Date.now() - product.lastScrapedAt.getTime();
    return age > this.CACHE_TTL_SECONDS * 1000;
  }

  async getCacheTTL(): Promise<number> {
    return this.CACHE_TTL_SECONDS;
  }

  async isCacheStale(lastScrapedAt: Date | null): Promise<boolean> {
    if (!lastScrapedAt) return true;
    const age = Date.now() - lastScrapedAt.getTime();
    return age > this.CACHE_TTL_SECONDS * 1000;
  }
}
