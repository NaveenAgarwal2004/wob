import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix with exclusion for root route (Fixes Health Check 404)
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  // ROBUST CORS CONFIGURATION
  // 1. Define default allowed origins (Localhost + All Vercel Deployments)
  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:3000',
    /^https:\/\/.*\.vercel\.app$/, // Regex to allow any Vercel deployment
  ];

  // 2. Add any specific origins from Environment Variables
  if (process.env.CORS_ORIGIN) {
    const envOrigins = process.env.CORS_ORIGIN.split(',').map((origin) =>
      origin.trim(),
    );
    allowedOrigins.push(...envOrigins);
  }

  // 3. Enable CORS with the combined list
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('World of Books API')
    .setDescription('Product exploration platform API')
    .setVersion('1.0')
    .addTag('navigations')
    .addTag('categories')
    .addTag('products')
    .addTag('view-history')
    .addTag('scrape-jobs')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap();