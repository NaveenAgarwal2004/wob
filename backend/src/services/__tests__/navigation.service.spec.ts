// backend/src/services/__tests__/navigation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NavigationService } from '../navigation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Navigation } from '../../entities/navigation.entity';
import { NotFoundException } from '@nestjs/common';

describe('NavigationService', () => {
  let service: NavigationService;
  let mockRepository: any;

  const mockNavigation: Navigation = {
    id: '1',
    title: 'Books',
    slug: 'books',
    sourceUrl: 'https://example.com/books',
    lastScrapedAt: new Date(),
    categories: [],
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
        NavigationService,
        {
          provide: getRepositoryToken(Navigation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NavigationService>(NavigationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return an array of navigations', async () => {
      const navigations = [mockNavigation];
      mockRepository.find.mockResolvedValue(navigations);

      const result = await service.getAll();

      expect(result).toEqual(navigations);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { title: 'ASC' },
      });
    });

    it('should return empty array when no navigations exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return a navigation by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockNavigation);

      const result = await service.getById('1');

      expect(result).toEqual(mockNavigation);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['categories'],
      });
    });

    it('should throw NotFoundException when navigation not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getById('999')).rejects.toThrow(NotFoundException);
      await expect(service.getById('999')).rejects.toThrow(
        'Navigation with ID 999 not found'
      );
    });
  });
});