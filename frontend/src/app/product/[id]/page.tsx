'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, productAPI } from '@/lib/api';
import { ProductWithDetails } from '@/lib/types';
import Image from 'next/image';
import { Star, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useBrowsingHistory } from '@/lib/store';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const addToHistory = useBrowsingHistory((state) => state.addToHistory);
  const { data, error, isLoading, mutate } = useSWR<ProductWithDetails>(
    `/products/${params.id}`,
    fetcher
  );
  const [refreshing, setRefreshing] = useState(false);

  // Track view when product loads
  useEffect(() => {
    if (data) {
      addToHistory(`/product/${params.id}`, data.title);
    }
  }, [data, params.id, addToHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await productAPI.scrape(params.id as string);
      setTimeout(() => mutate(), 3000);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">Failed to load product details.</p>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-700 transition">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          {data.category && (
            <>
              <Link
                href={`/categories/${data.category.navigationId}`}
                className="text-blue-600 hover:text-blue-700 transition"
              >
                {data.category.title.split(' - ')[0]}
              </Link>
              <span className="text-gray-400">/</span>
            </>
          )}
          <span className="text-gray-600">{data.title}</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="relative">
              {data.imageUrl ? (
                <Image
                  src={data.imageUrl}
                  alt={data.title}
                  width={500}
                  height={700}
                  className="rounded-lg w-full object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h1>
              {data.author && <p className="text-xl text-gray-600 mb-4">By {data.author}</p>}
              
              {data.price && (
                <p className="text-3xl font-bold text-green-600 mb-6">£{data.price.toFixed(2)}</p>
              )}

              {/* Ratings */}
              {data.detail?.ratingsAvg && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(data.detail!.ratingsAvg!)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {data.detail.ratingsAvg.toFixed(1)} ({data.detail.reviewsCount} reviews)
                  </span>
                </div>
              )}

              {/* Description */}
              {data.detail?.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{data.detail.description}</p>
                </div>
              )}

              {/* Specifications */}
              {data.detail?.specs && Object.keys(data.detail.specs).length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Specifications</h2>
                  <dl className="grid grid-cols-2 gap-2">
                    {Object.entries(data.detail.specs).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-200 py-2">
                        <dt className="text-sm font-medium text-gray-500">{key}</dt>
                        <dd className="text-sm text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {data.reviews && data.reviews.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
            <div className="space-y-6">
              {data.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{review.author}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
