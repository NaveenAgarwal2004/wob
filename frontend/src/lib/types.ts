export interface Navigation {
  id: string;
  title: string;
  slug: string;
  sourceUrl: string;
  lastScrapedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  navigationId: string;
  parentId: string | null;
  title: string;
  slug: string;
  productCount: number;
  sourceUrl: string;
  lastScrapedAt: string | null;
}

export interface Product {
  id: string;
  sourceId: string;
  title: string;
  author: string | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  sourceUrl: string;
  categoryId: string;
  lastScrapedAt: string | null;
}

export interface ProductDetail {
  id: string;
  productId: string;
  description: string | null;
  specs: Record<string, any>;
  ratingsAvg: number | null;
  reviewsCount: number;
  recommendations: string[];
}

export interface Review {
  id: string;
  productId: string;
  author: string | null;
  rating: number;
  text: string | null;
  createdAt: string;
}

export interface ProductWithDetails extends Product {
  detail: ProductDetail | null;
  reviews: Review[];
  category: Category;
}
