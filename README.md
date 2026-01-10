# World of Books Product Explorer

A production-ready, full-stack product exploration platform with **Algolia API integration** for real-time product data from World of Books.

## 🚀 Features

- **Algolia API Integration**: Direct API calls to World of Books' Algolia search index for real product data ✨
- **Real-time Scraping**: On-demand data retrieval with hybrid approach (Algolia + Playwright)
- **Smart Caching**: Intelligent caching with configurable TTL to minimize server load
- **Responsive Design**: Fully responsive UI that works on desktop and mobile
- **Accessible**: WCAG AA compliant with semantic HTML and keyboard navigation
- **Queue System**: Async job processing for long-running scrapes
- **Browsing History**: Track user navigation with both client-side and backend persistence
- **Comprehensive**: Full product details including reviews, ratings, and recommendations

## 🆕 Recent Updates

**Algolia Integration Complete! (Option B)**
- ✅ Replaced Playwright HTML scraping with direct Algolia API calls
- ✅ Now fetches real product data (titles, authors, prices, images)
- ✅ Fast, reliable, and ethical data retrieval
- ✅ See [ALGOLIA_INTEGRATION.md](./ALGOLIA_INTEGRATION.md) for details

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
- **Algolia API** for product search (World of Books integration) ✨
- Crawlee + Playwright for detail page scraping
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
│   │   └── database/          # Database configuration
│   └── test/                  # E2E tests
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js app router pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities and API client
│   └── public/               # Static assets
└── README.md
```

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+ (for queue system)
- Git

### Backend Setup

```bash
cd backend
npm install

# Install Playwright browsers
npx playwright install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Update: DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD

# Start development server
npm run start:dev
```

The backend will be available at `http://localhost:3001`  
Swagger docs at `http://localhost:3001/api/docs`

### Frontend Setup

```bash
cd frontend
npm install

# Copy environment file (already configured for local dev)
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Database Setup

1. **Create PostgreSQL Database:**
```sql
CREATE DATABASE wob_db;
```

2. **Run Migrations:**
The application uses TypeORM with `synchronize: true` in development, so tables will be created automatically on first run.

3. **Seed Data (Optional):**
If you want to start with sample data:
```bash
cd backend
npm run seed
```

## 📊 Database Schema

The application uses the following main entities:

- **Navigation**: Top-level navigation headings (e.g., Books, Children's Books)
- **Category**: Book categories and subcategories
- **Product**: Individual book products
- **ProductDetail**: Extended product information (description, specs, ratings)
- **Review**: Customer reviews
- **ScrapeJob**: Scraping job tracking and status
- **ViewHistory**: User browsing history tracking

## 🔄 API Documentation

### Main Endpoints

```
GET    /api/navigations              # List all navigations
GET    /api/navigations/:id          # Get navigation by ID
POST   /api/navigations/:id/scrape   # Trigger category scrape

GET    /api/categories/navigation/:id # Get categories by navigation
GET    /api/categories/:id            # Get category by ID
POST   /api/categories/:id/scrape     # Trigger product scrape

GET    /api/products/category/:id     # Get products (with pagination)
GET    /api/products/:id              # Get product detail
POST   /api/products/:id/scrape       # Refresh product data

POST   /api/view-history/track        # Track user navigation
GET    /api/view-history              # Get browsing history

GET    /api/scrape-jobs               # List scrape jobs
GET    /api/scrape-jobs/:id           # Get job status
```

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

### Backend Deployment Options

**Option 1: Railway**
1. Create a new Railway project
2. Add PostgreSQL and Redis services
3. Connect your GitHub repository
4. Set environment variables
5. Deploy

**Option 2: Render**
1. Create a new Web Service
2. Connect your repository
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && node dist/main`
5. Add environment variables
6. Deploy

**Required Environment Variables:**
```
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=wob_db
REDIS_HOST=your-redis-host
REDIS_PORT=6379
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Frontend Deployment (Vercel)

1. Import your GitHub repository to Vercel
2. Set framework preset to Next.js
3. Set root directory to `frontend`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   ```
5. Deploy

## ⚙️ Configuration

### Environment Variables

**Backend**

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_HOST | PostgreSQL host | localhost |
| DATABASE_PORT | PostgreSQL port | 5432 |
| DATABASE_USERNAME | Database username | postgres |
| DATABASE_PASSWORD | Database password | postgres |
| DATABASE_NAME | Database name | wob_db |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| PORT | Server port | 3001 |
| SCRAPE_DELAY_MS | Delay between requests (ms) | 2000 |
| CACHE_TTL_SECONDS | Cache time-to-live | 3600 |
| NODE_ENV | Environment | development |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |

**Frontend**

| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:3001/api |

## 🎯 Key Features Explained

### 1. Smart Caching System
- Caches scraped data for 1 hour (configurable)
- Reduces load on World of Books servers
- Automatic cache invalidation
- Manual refresh available for individual products

### 2. Queue-Based Scraping
- Uses BullMQ for async job processing
- Jobs tracked in database
- Retry logic with exponential backoff
- Status monitoring via API

### 3. Ethical Scraping
- 2-3 second delay between requests
- User-agent rotation
- Respects robots.txt
- Rate limiting implemented

### 4. Browsing History
- Client-side persistence with Zustand
- Backend tracking via API
- Session-based tracking
- Accessible via floating button

### 5. Responsive Design
- Mobile-first approach
- Tailwind CSS for styling
- Accessible components
- Loading states and error handling

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run tests and linting
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- World of Books for the data source
- NestJS and Next.js teams for excellent frameworks
- Crawlee team for robust scraping tools

---

**Note**: This project is for educational purposes. Please respect World of Books' robots.txt and terms of service when scraping.

## 🐛 Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify Redis is running (if using queues)
- Run `npx playwright install` if browser issues

### Frontend won't connect to backend
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env`
- Check backend is running on correct port
- Ensure CORS is configured correctly

### No products showing
- Scraping may be in progress - wait a few seconds
- Check scrape job status at `/api/scrape-jobs`
- Manually trigger scrape via API or refresh button

### Redis connection issues
- Ensure Redis is running locally
- Check REDIS_HOST and REDIS_PORT in backend `.env`
- For production, consider using managed Redis (Upstash, Redis Cloud)

## 📞 Support

For issues or questions, please open an issue on GitHub.
