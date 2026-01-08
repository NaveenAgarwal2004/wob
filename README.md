# World of Books Product Explorer

A production-ready, full-stack product exploration platform with on-demand web scraping capabilities for World of Books.

## 🚀 Features

- **Real-time Scraping**: On-demand data retrieval from World of Books
- **Smart Caching**: Intelligent caching with configurable TTL to minimize server load
- **Responsive Design**: Fully responsive UI that works on desktop and mobile
- **Accessible**: WCAG AA compliant with semantic HTML and keyboard navigation
- **Queue System**: Async job processing for long-running scrapes
- **Comprehensive**: Full product details including reviews, ratings, and recommendations

## 📋 Architecture

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- SWR for data fetching
- Zustand for state management

**Backend**
- NestJS with TypeScript
- PostgreSQL database
- Crawlee + Playwright for scraping
- Bull queue with Redis
- Swagger API documentation

### Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── entities/          # TypeORM entities
│   │   ├── controllers/       # API controllers
│   │   ├── services/          # Business logic
│   │   ├── scraper/           # Scraping engine
│   │   ├── dto/               # Data transfer objects
│   │   ├── filters/           # Exception filters
│   │   └── migrations/        # Database migrations
│   ├── test/                  # E2E tests
│   └── package.json
├── frontend/
│   ├── app/                   # Next.js app router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities and API client
│   └── package.json
└── docker-compose.yml
```

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)
- Git

### Quick Start with Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Install backend dependencies
cd backend
npm install
npx playwright install

# Copy environment file
cp .env.example .env

# Run migrations
npm run migration:run

# Start backend
npm run start:dev
```

The backend will be available at `http://localhost:3001`  
Swagger docs at `http://localhost:3001/api/docs`

### Frontend Setup

```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📊 Database Schema

The application uses the following main entities:

- **Navigation**: Top-level navigation headings
- **Category**: Book categories and subcategories
- **Product**: Individual book products
- **ProductDetail**: Extended product information
- **Review**: Customer reviews
- **ScrapeJob**: Scraping job tracking
- **ViewHistory**: User browsing history

## 🔄 API Documentation

Full API documentation available at `/api/docs` when running the backend.

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                  # Run unit tests
npm run test:e2e          # Run E2E tests
npm run test:cov          # Run with coverage
```

### Frontend Tests

```bash
cd frontend
npm test                  # Run tests
npm run test:watch        # Run in watch mode
```

## 🚀 Deployment

### Backend (Railway/Render)

1. Create a new service and connect your GitHub repository
2. Set the root directory to `backend`
3. Add environment variables (see .env.example)
4. Deploy

### Frontend (Vercel)

1. Import your GitHub repository
2. Set framework preset to Next.js
3. Set root directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL`
5. Deploy

## 📝 License

This project is licensed under the MIT License.

---

**Note**: This project is for educational purposes. Please respect World of Books' robots.txt and terms of service when scraping.
