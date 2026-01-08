export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">World of Books Explorer</h3>
            <p className="text-gray-600 text-sm">
              Discover and explore books from the World of Books catalog.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-600 hover:text-blue-600 text-sm transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-600 hover:text-blue-600 text-sm transition">
                  About
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <p className="text-gray-600 text-sm">
              This project is for educational purposes.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} WoB Explorer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
