import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Navigation } from '../entities/navigation.entity';

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(Navigation)
    private navigationRepo: Repository<Navigation>,
  ) {}

  async getAll(): Promise<Navigation[]> {
    return this.navigationRepo.find({
      order: { title: 'ASC' },
    });
  }

  async getById(id: string): Promise<Navigation> {
    const navigation = await this.navigationRepo.findOne({ 
      where: { id },
      relations: ['categories']
    });
    
    if (!navigation) {
      throw new NotFoundException(`Navigation with ID ${id} not found`);
    }
    
    return navigation;
  }
}
