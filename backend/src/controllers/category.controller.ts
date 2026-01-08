import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    @InjectQueue('scrape-queue') private scrapeQueue: Queue,
  ) {}

  @Get('navigation/:navigationId')
  @ApiOperation({ summary: 'Get categories by navigation' })
  @ApiResponse({ status: 200, description: 'Returns categories for navigation' })
  async getCategoriesByNavigation(@Param('navigationId') navigationId: string) {
    const categories = await this.categoryService.getByNavigation(navigationId);
    
    // Trigger scrape if empty
    if (categories.length === 0) {
      await this.scrapeQueue.add('scrape-category', { type: 'category', id: navigationId });
    }
    
    return categories;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Returns category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param('id') id: string) {
    return this.categoryService.getById(id);
  }

  @Post(':id/scrape')
  @ApiOperation({ summary: 'Trigger scrape for category products' })
  @ApiResponse({ status: 202, description: 'Scrape job queued' })
  async scrapeCategory(@Param('id') id: string) {
    const job = await this.scrapeQueue.add('scrape-product', { type: 'product', id, force: true });
    return {
      message: 'Scrape job queued',
      jobId: job.id,
    };
  }
}
