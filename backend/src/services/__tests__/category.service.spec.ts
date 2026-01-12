// backend/src/services/__tests__/category.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '../category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../../entities/category.entity';
import { NotFoundException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let mockRepository: any;

  const mockCategory: Category = {
    id: '1',
    navigationId: 'nav-1',
    parentId: null,
    title: 'Fiction',
    slug: 'fiction',
    productCount: 100,
    sourceUrl: 'https://example.com/fiction',
    lastScrapedAt: new Date(),
    navigation: null,
    parent: null,
    children: [],
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByNavigation', () => {
    it('should return categories for a navigation', async () => {
      const categories = [mockCategory];
      mockRepository.find.mockResolvedValue(categories);

      const result = await service.getByNavigation('nav-1');

      expect(result).toEqual(categories);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { navigationId: 'nav-1' },
        order: { title: 'ASC' },
      });
    });

    it('should return empty array when no categories exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getByNavigation('nav-999');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return a category with relations', async () => {
      const categoryWithRelations = {
        ...mockCategory,
        products: [],
        children: [],
      };
      mockRepository.findOne.mockResolvedValue(categoryWithRelations);

      const result = await service.getById('1');

      expect(result).toEqual(categoryWithRelations);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['products', 'children'],
      });
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getById('999')).rejects.toThrow(NotFoundException);
      await expect(service.getById('999')).rejects.toThrow(
        'Category with ID 999 not found'
      );
    });
  });
});