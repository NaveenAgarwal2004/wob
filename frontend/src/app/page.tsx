export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          World of Books Explorer
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Phase 0 Setup Complete! Next steps:
          </p>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>✓ Backend NestJS structure created</li>
            <li>✓ Frontend Next.js 14 structure created</li>
            <li>✓ Docker Compose configuration ready</li>
            <li>✓ Environment files configured</li>
            <li>✓ Playwright installed</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-900">
              <strong>Next Phase:</strong> Database Schema & Models (Phase 1)
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
