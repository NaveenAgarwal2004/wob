export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">About World of Books Explorer</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              World of Books Explorer is a comprehensive platform designed to help you discover and explore
              books from the World of Books catalog. Our mission is to make book discovery easy, intuitive,
              and enjoyable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Browse books by category and subcategory</li>
              <li>View detailed product information including reviews and ratings</li>
              <li>Real-time data scraping for up-to-date information</li>
              <li>Smart caching for optimal performance</li>
              <li>Responsive design for all devices</li>
              <li>Track your browsing history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Technology</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              This project is built with modern web technologies:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Frontend</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Next.js 14 (App Router)</li>
                  <li>React 18</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>SWR for data fetching</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Backend</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>NestJS</li>
                  <li>PostgreSQL</li>
                  <li>TypeORM</li>
                  <li>Crawlee + Playwright</li>
                  <li>BullMQ + Redis</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Ethical Scraping</h2>
            <p className="text-gray-700 leading-relaxed">
              We practice responsible web scraping with rate limiting, caching, and respect for
              robots.txt. All data is scraped ethically with appropriate delays between requests.
            </p>
          </section>

          <section className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Educational Purpose</h2>
            <p className="text-gray-700">
              This project is created for educational purposes to demonstrate full-stack web development,
              web scraping, and modern application architecture.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
