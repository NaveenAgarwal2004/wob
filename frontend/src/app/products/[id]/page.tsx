'use client';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Category } from '@/lib/types';
import ProductGrid from '@/components/ProductGrid';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const params = useParams();
  const { data: category, error, isLoading } = useSWR<Category>(
    `/categories/${params.id}`,
    fetcher
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-700 transition"
          >
            Home
          </Link>
          <span className="text-gray-400">/</span>
          {category && (
            <>
              <Link 
                href={`/categories/${category.navigationId}`}
                className="text-blue-600 hover:text-blue-700 transition"
              >
                Back to Categories
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{category.title}</span>
            </>
          )}
        </div>

        {/* Header */}
        {isLoading ? (
          <div className="flex items-center gap-2 mb-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-600">Failed to load category details.</p>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {category?.title}
            </h1>
            <p className="text-gray-600">
              {category?.productCount || 0} products available
            </p>
          </div>
        )}

        {/* Products Grid */}
        <Suspense fallback={<LoadingSkeleton count={8} />}>
          <ProductGrid categoryId={params.id as string} />
        </Suspense>
      </div>
    </main>
  );
}
