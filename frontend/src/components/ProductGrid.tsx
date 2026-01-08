'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Product } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGridProps {
  categoryId: string;
}

interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export default function ProductGrid({ categoryId }: ProductGridProps) {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, error, isLoading } = useSWR<ProductResponse>(
    `/products/category/${categoryId}?page=${page}&limit=${limit}`,
    fetcher
  );

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" data-testid="product-grid-error">
        <p className="text-red-600">Failed to load products. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="product-grid-loading">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data || data.products.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center" data-testid="product-grid-empty">
        <p className="text-yellow-700">No products found. Scraping may be in progress...</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / limit);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="product-grid">
        {data.products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white"
            data-testid={`product-grid-item-${product.id}`}
          >
            <div className="aspect-[3/4] relative bg-gray-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  data-testid={`product-grid-image-${product.id}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400" data-testid={`product-grid-no-image-${product.id}`}>
                  No Image
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 
                className="font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-2 mb-1"
                data-testid={`product-grid-title-${product.id}`}
              >
                {product.title}
              </h3>
              {product.author && (
                <p 
                  className="text-sm text-gray-600 mb-2 line-clamp-1"
                  data-testid={`product-grid-author-${product.id}`}
                >
                  by {product.author}
                </p>
              )}
              {product.price && (
                <p 
                  className="text-lg font-bold text-green-600"
                  data-testid={`product-grid-price-${product.id}`}
                >
                  £{product.price.toFixed(2)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-2"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-2"
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
