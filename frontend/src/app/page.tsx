import { Suspense } from 'react';
import NavigationList from '@/components/NavigationList';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            World of Books Explorer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover thousands of books from various categories. Browse, explore, and find your next great read.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Browse by Category</h2>
          <Suspense fallback={<LoadingSkeleton count={6} />}>
            <NavigationList />
          </Suspense>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Data</h3>
            <p className="text-gray-600 text-sm">
              On-demand scraping ensures you always see the latest products and prices.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Navigation</h3>
            <p className="text-gray-600 text-sm">
              Browse through categories and subcategories with our intuitive interface.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Information</h3>
            <p className="text-gray-600 text-sm">
              View product details, reviews, ratings, and recommendations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
