'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Navigation } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';

export default function NavigationList() {
  const { data, error, isLoading } = useSWR<Navigation[]>(
    '/navigations',
    fetcher
  );

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" data-testid="navigation-error">
        <p className="text-red-600">Failed to load navigations. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]" data-testid="navigation-loading">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center" data-testid="navigation-empty">
        <p className="text-yellow-700">No navigations found. Scraping may be in progress...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="navigation-list">
      {data.map((nav) => (
        <Link
          key={nav.id}
          href={`/categories/${nav.id}`}
          className="group border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white"
          data-testid={`navigation-card-${nav.id}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 
                className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition"
                data-testid={`navigation-title-${nav.id}`}
              >
                {nav.title}
              </h2>
              {nav.lastScrapedAt && (
                <p className="text-xs text-gray-500 mt-2" data-testid={`navigation-updated-${nav.id}`}>
                  Updated: {new Date(nav.lastScrapedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      ))}
    </div>
  );
}
