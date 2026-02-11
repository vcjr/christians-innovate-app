import { WifiOff, BookOpen, MessageSquare, Users } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-blue-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <WifiOff className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-4 text-gray-900">
          You&apos;re Offline
        </h1>

        <p className="text-gray-700 text-center mb-8">
          No internet connection detected. You can still access downloaded content and cached pages.
        </p>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="font-semibold text-gray-900 mb-4 text-lg">Available Offline:</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Bible Readings</p>
                <p className="text-sm text-gray-700">
                  Access downloaded Bible translations and recent verses
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Saved Content</p>
                <p className="text-sm text-gray-700">
                  View recently loaded prayer posts and comments
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Cached Pages</p>
                <p className="text-sm text-gray-700">
                  Browse previously visited pages and profiles
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
          <p className="text-sm text-white">
            <strong>Tip:</strong> Your progress will be saved locally and synced automatically when you reconnect.
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  )
}
