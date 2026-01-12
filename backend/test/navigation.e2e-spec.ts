// backend/test/navigation.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Navigation E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/navigations (GET)', () => {
    it('should return an array of navigations', () => {
      return request(app.getHttpServer())
        .get('/api/navigations')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/navigations/:id (GET)', () => {
    it('should return a single navigation with categories', async () => {
      // First get all navigations
      const navsResponse = await request(app.getHttpServer())
        .get('/api/navigations');
      
      if (navsResponse.body.length > 0) {
        const firstNav = navsResponse.body[0];
        
        return request(app.getHttpServer())
          .get(`/api/navigations/${firstNav.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('title');
            expect(res.body).toHaveProperty('slug');
          });
      }
    });

    it('should return 404 for non-existent navigation', () => {
      return request(app.getHttpServer())
        .get('/api/navigations/999')
        .expect(404);
    });
  });

  describe('/api/categories/navigation/:navigationId (GET)', () => {
    it('should return categories for a navigation', async () => {
      const navsResponse = await request(app.getHttpServer())
        .get('/api/navigations');
      
      if (navsResponse.body.length > 0) {
        const firstNav = navsResponse.body[0];
        
        return request(app.getHttpServer())
          .get(`/api/categories/navigation/${firstNav.id}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      }
    });
  });

  describe('/api/products/category/:categoryId (GET)', () => {
    it('should return paginated products', async () => {
      // Get navigations -> categories -> products
      const navsResponse = await request(app.getHttpServer())
        .get('/api/navigations');
      
      if (navsResponse.body.length > 0) {
        const firstNav = navsResponse.body[0];
        const catsResponse = await request(app.getHttpServer())
          .get(`/api/categories/navigation/${firstNav.id}`);
        
        if (catsResponse.body.length > 0) {
          const firstCat = catsResponse.body[0];
          
          return request(app.getHttpServer())
            .get(`/api/products/category/${firstCat.id}`)
            .expect(200)
            .expect((res) => {
              expect(res.body).toHaveProperty('products');
              expect(res.body).toHaveProperty('total');
              expect(res.body).toHaveProperty('page');
              expect(res.body).toHaveProperty('limit');
              expect(Array.isArray(res.body.products)).toBe(true);
            });
        }
      }
    });

    it('should respect pagination parameters', async () => {
      const navsResponse = await request(app.getHttpServer())
        .get('/api/navigations');
      
      if (navsResponse.body.length > 0) {
        const firstNav = navsResponse.body[0];
        const catsResponse = await request(app.getHttpServer())
          .get(`/api/categories/navigation/${firstNav.id}`);
        
        if (catsResponse.body.length > 0) {
          const firstCat = catsResponse.body[0];
          
          return request(app.getHttpServer())
            .get(`/api/products/category/${firstCat.id}?page=1&limit=5`)
            .expect(200)
            .expect((res) => {
              expect(res.body.page).toBe(1);
              expect(res.body.limit).toBe(5);
              expect(res.body.products.length).toBeLessThanOrEqual(5);
            });
        }
      }
    });
  });

  describe('/api/view-history (POST)', () => {
    it('should track view history', () => {
      return request(app.getHttpServer())
        .post('/api/view-history/track')
        .send({
          sessionId: 'test-session-123',
          pathJson: {
            path: '/products/test',
            title: 'Test Product',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('sessionId');
          expect(res.body).toHaveProperty('pathJson');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/view-history/track')
        .send({
          sessionId: 'test-session-123',
          // Missing pathJson
        })
        .expect(400);
    });
  });

  describe('/api/view-history (GET)', () => {
    it('should get view history by sessionId', () => {
      return request(app.getHttpServer())
        .get('/api/view-history?sessionId=test-session-123')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});