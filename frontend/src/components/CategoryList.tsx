'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Category } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight, Loader2, Package } from 'lucide-react';

interface CategoryListProps {
  navigationId: string;
}

export default function CategoryList({ navigationId }: CategoryListProps) {
  const { data, error, isLoading } = useSWR<Category[]>(
    `/categories/navigation/${navigationId}`,
    fetcher
  );

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">Failed to load categories. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-700">No categories found. Scraping may be in progress...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((category) => (
        <Link
          key={category.id}
          href={`/products/${category.id}`}
          className="group border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition mb-2">
                {category.title}
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <Package className="h-4 w-4 mr-1" />
                <span>{category.productCount} products</span>
              </div>
              {category.lastScrapedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Updated: {new Date(category.lastScrapedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}
