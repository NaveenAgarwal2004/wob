// frontend/src/app/contact/page.tsx
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Get in Touch</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Have questions, feedback, or suggestions about World of Books Explorer? 
                We'd love to hear from you!
              </p>
            </section>

            <section className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Project Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">GitHub Repository</dt>
                  <dd className="mt-1">
                    <a 
                      href="https://github.com/NaveenAgarwal2004/wob" 
                      className="text-blue-600 hover:text-blue-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on GitHub
                    </a>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">API Documentation</dt>
                  <dd className="mt-1">
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/docs`}
                      className="text-blue-600 hover:text-blue-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Swagger API Docs
                    </a>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Technology Stack</dt>
                  <dd className="mt-1 text-gray-700">
                    Next.js, NestJS, PostgreSQL, Algolia, Playwright
                  </dd>
                </div>
              </dl>
            </section>

            <section className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Report an Issue</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Found a bug or have a feature request? Please open an issue on our GitHub repository.
              </p>
              <a
                href="https://github.com/NaveenAgarwal2004/wob/issues"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open an Issue
              </a>
            </section>

            <section className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">About the Developer</h3>
              <p className="text-gray-700 leading-relaxed">
                This project was created as a full-stack assessment to demonstrate proficiency in:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Full-stack TypeScript development</li>
                <li>API integration and web scraping</li>
                <li>Database design and optimization</li>
                <li>Modern frontend frameworks (Next.js, React)</li>
                <li>Backend architecture (NestJS, PostgreSQL)</li>
                <li>Queue systems and async processing</li>
              </ul>
            </section>

            <section className="bg-blue-50 p-6 rounded-lg border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Disclaimer</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                This project is for educational and assessment purposes only. All product data is sourced 
                from World of Books via their public Algolia API and web pages. We practice ethical scraping 
                with proper delays, caching, and respect for their terms of service. This is not an official 
                World of Books application.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}