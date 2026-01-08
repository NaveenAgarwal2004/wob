'use client';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Navigation } from '@/lib/types';
import CategoryList from '@/components/CategoryList';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const params = useParams();
  const { data: navigation, error, isLoading } = useSWR<Navigation>(
    `/navigations/${params.id}`,
    fetcher
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <Link 
          href="/" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        {isLoading ? (
          <div className="flex items-center gap-2 mb-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-600">Failed to load navigation details.</p>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {navigation?.title}
            </h1>
            <p className="text-gray-600">Browse categories within this section</p>
          </div>
        )}

        {/* Categories Grid */}
        <Suspense fallback={<LoadingSkeleton count={6} />}>
          <CategoryList navigationId={params.id as string} />
        </Suspense>
      </div>
    </main>
  );
}
