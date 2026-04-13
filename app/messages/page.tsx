import { MessageSquare, Users } from 'lucide-react'
import Link from 'next/link'

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16 bg-white">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <MessageSquare className="h-7 w-7 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Your messages</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
        Select a conversation from the left, or start a new one by visiting the Directory.
      </p>
      <Link
        href="/directory"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-sm font-medium transition"
      >
        <Users className="h-4 w-4" />
        Find someone to message
      </Link>
    </div>
  )
}
