// backend/src/services/__tests__/product.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../entities/product.entity';
import { NotFoundException } from '@nestjs/common';
import { PaginationDto } from '../../dto/pagination.dto';

describe('ProductService', () => {
  let service: ProductService;
  let mockRepository: any;

  const mockProduct: Product = {
    id: '1',
    sourceId: 'book-123',
    title: 'Test Book',
    author: 'Test Author',
    price: 9.99,
    currency: 'GBP',
    imageUrl: 'https://example.com/book.jpg',
    sourceUrl: 'https://example.com/book-123',
    categoryId: 'cat-1',
    lastScrapedAt: new Date(),
    category: null,
    detail: null,
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByCategory', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct];
      const total = 100;
      mockRepository.findAndCount.mockResolvedValue([products, total]);

      const pagination: PaginationDto = { page: 1, limit: 20 };
      const result = await service.getByCategory('cat-1', pagination);

      expect(result).toEqual({
        products,
        total,
        page: 1,
        limit: 20,
      });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
        skip: 0,
        take: 20,
        order: { title: 'ASC' },
      });
    });

    it('should handle pagination correctly', async () => {
      const products = [mockProduct];
      mockRepository.findAndCount.mockResolvedValue([products, 100]);

      const pagination: PaginationDto = { page: 3, limit: 10 };
      await service.getByCategory('cat-1', pagination);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
        skip: 20, // (page - 1) * limit = (3 - 1) * 10 = 20
        take: 10,
        order: { title: 'ASC' },
      });
    });

    it('should return empty array when no products exist', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const pagination: PaginationDto = { page: 1, limit: 20 };
      const result = await service.getByCategory('cat-999', pagination);

      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getDetail', () => {
    it('should return product with all relations', async () => {
      const productWithDetails = {
        ...mockProduct,
        detail: {
          id: '1',
          productId: '1',
          description: 'Test description',
          specs: {},
          ratingsAvg: 4.5,
          reviewsCount: 10,
          recommendations: [],
          product: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        reviews: [],
        category: null,
      };

      mockRepository.findOne.mockResolvedValue(productWithDetails);

      const result = await service.getDetail('1');

      expect(result).toEqual(productWithDetails);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['detail', 'reviews', 'category'],
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getDetail('999')).rejects.toThrow(NotFoundException);
      await expect(service.getDetail('999')).rejects.toThrow(
        'Product with ID 999 not found'
      );
    });
  });
});