import { Controller, Get, Post, Param, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { PaginationDto } from '../dto/pagination.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private productService: ProductService,
    @InjectQueue('scrape-queue') private scrapeQueue: Queue,
  ) {}

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns products for category' })
  async getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query(ValidationPipe) pagination: PaginationDto,
  ) {
    const result = await this.productService.getByCategory(categoryId, pagination);
    
    // Trigger scrape if empty
    if (result.products.length === 0) {
      await this.scrapeQueue.add('scrape-product', { 
        type: 'product',
        id: categoryId,
        page: pagination.page,
        limit: pagination.limit
      });
    }
    
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail' })
  @ApiResponse({ status: 200, description: 'Returns product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id') id: string) {
    const product = await this.productService.getDetail(id);
    
    // Trigger detail scrape if not present
    if (!product.detail) {
      await this.scrapeQueue.add('scrape-product-detail', { type: 'product_detail', id });
    }
    
    return product;
  }

  @Post(':id/scrape')
  @ApiOperation({ summary: 'Refresh product data' })
  @ApiResponse({ status: 202, description: 'Scrape job queued' })
  async scrapeProduct(@Param('id') id: string) {
    const job = await this.scrapeQueue.add('scrape-product-detail', { type: 'product_detail', id, force: true });
    return {
      message: 'Scrape job queued',
      jobId: job.id,
    };
  }
}
