'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Only show prompt if user hasn't dismissed it before and not already installed
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed && !isInstalled) {
        setShowPrompt(true)
      }
    }

    if (!isInstalled) {
      window.addEventListener('beforeinstallprompt', handler)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-2xl z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <Download className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold mb-1">Install Christians Innovate</p>
          <p className="text-sm text-blue-100 mb-3">
            Add to your home screen for quick access and offline Bible reading
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-50 transition-colors text-sm"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-md border border-white/30 hover:bg-white/10 transition-colors text-sm"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
