import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async getByNavigation(navigationId: string): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { navigationId },
      order: { title: 'ASC' },
    });
  }

  async getById(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ 
      where: { id },
      relations: ['products', 'children']
    });
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return category;
  }
}
