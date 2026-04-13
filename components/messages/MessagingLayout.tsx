'use client'

import { usePathname } from 'next/navigation'

export function MessagingLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isConversation = pathname.startsWith('/messages/') && pathname !== '/messages'

  return (
    <div className="fixed top-16 inset-x-0 bottom-0 z-30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex h-full bg-white overflow-hidden border-x border-t border-gray-100 rounded-t-xl">
          {/* Left sidebar */}
          <aside
            className={`flex-shrink-0 w-full md:w-72 lg:w-80 border-r border-gray-100 bg-white flex-col ${isConversation ? 'hidden md:flex' : 'flex'
              }`}
          >
            {sidebar}
          </aside>

          {/* Right panel */}
          <main
            className={`flex-1 flex-col min-w-0 bg-white ${isConversation ? 'flex' : 'hidden md:flex'
              }`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
