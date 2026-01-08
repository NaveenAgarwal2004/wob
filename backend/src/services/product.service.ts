import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { PaginationDto } from '../dto/pagination.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async getByCategory(
    categoryId: string,
    pagination: PaginationDto,
  ): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
    const [products, total] = await this.productRepo.findAndCount({
      where: { categoryId },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      order: { title: 'ASC' },
    });

    return {
      products,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async getDetail(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['detail', 'reviews', 'category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }
}
