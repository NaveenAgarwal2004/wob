// frontend/src/app/about/page.tsx
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          About World of Books Explorer
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              World of Books Explorer is a comprehensive platform designed to help you discover and explore
              books from the World of Books catalog. Our mission is to make book discovery easy, intuitive,
              and enjoyable through real-time data and intelligent search.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Browse 9+ million products from World of Books</li>
              <li>Real-time product search powered by Algolia API</li>
              <li>Detailed product information including reviews and ratings</li>
              <li>Smart caching for optimal performance</li>
              <li>Responsive design for all devices</li>
              <li>Track your browsing history</li>
              <li>On-demand data refresh</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Technology Stack</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Frontend</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Next.js 14 (App Router)</li>
                  <li>• React 18 with TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• SWR for data fetching</li>
                  <li>• Zustand for state management</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Backend</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• NestJS with TypeScript</li>
                  <li>• PostgreSQL database</li>
                  <li>• Algolia API integration</li>
                  <li>• Playwright for web scraping</li>
                  <li>• BullMQ + Redis for job queues</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Architecture</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Our platform uses a hybrid approach for data retrieval:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Algolia API:</strong> Fast product search across millions of items</li>
              <li><strong>Playwright Scraping:</strong> Rich product details, reviews, and descriptions</li>
              <li><strong>Smart Caching:</strong> 1-hour TTL to minimize server load</li>
              <li><strong>Queue System:</strong> Async job processing for long-running scrapes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Ethical Scraping</h2>
            <p className="text-gray-700 leading-relaxed">
              We practice responsible web scraping with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
              <li>2-3 second delays between requests</li>
              <li>Aggressive caching to minimize load</li>
              <li>Respect for robots.txt and terms of service</li>
              <li>Exponential backoff on failures</li>
            </ul>
          </section>

          <section className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Educational Purpose</h2>
            <p className="text-gray-700">
              This project is created for educational purposes to demonstrate full-stack web development,
              API integration, web scraping, and modern application architecture.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact</h2>
            <p className="text-gray-700">
              For questions or feedback, please visit our{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-700 underline">
                contact page
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}