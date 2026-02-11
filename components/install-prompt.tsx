'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsInStandaloneMode(isStandalone)

    // Check if user dismissed the prompt and if 30 days have passed
    const dismissedData = localStorage.getItem('pwa-install-dismissed')
    let shouldShow = true

    if (dismissedData) {
      try {
        const dismissedTime = parseInt(dismissedData, 10)
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
        const now = Date.now()

        // If less than 30 days have passed, don't show
        if (now - dismissedTime < thirtyDaysInMs) {
          shouldShow = false
        } else {
          // Clear old dismissal, allow showing again
          localStorage.removeItem('pwa-install-dismissed')
        }
      } catch {
        // If parsing fails, clear and allow showing
        localStorage.removeItem('pwa-install-dismissed')
      }
    }

    // For iOS, show instructions if not installed and should show
    if (isIOSDevice && !isStandalone && shouldShow) {
      // Only show on Safari
      const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)
      if (isSafari) {
        setShowPrompt(true)
      }
      return
    }

    // For Android/Chrome - use beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Check if user has dismissed the prompt within the last 30 days
      const dismissedData = localStorage.getItem('pwa-install-dismissed')
      let shouldShow = true

      if (dismissedData && !isInstalled) {
        try {
          const dismissedTimestamp = parseInt(dismissedData, 10)
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
          const timeSinceDismissal = Date.now() - dismissedTimestamp

          if (timeSinceDismissal < thirtyDaysInMs) {
            shouldShow = false
          } else {
            // Clear expired dismissal
            localStorage.removeItem('pwa-install-dismissed')
          }
        } catch {
          // Invalid data, clear it
          localStorage.removeItem('pwa-install-dismissed')
        }
      }

      if (shouldShow && !isInstalled) {
        setShowPrompt(true)
      }
    }

    if (!isStandalone && !isIOSDevice) {
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
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store current timestamp instead of just 'true'
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt || isInStandaloneMode) return null

  // iOS Instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-2xl z-50 animate-slide-up">
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
            <div className="bg-white/10 p-3 rounded-md mb-3 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 rounded px-2 py-1 text-xs font-semibold">1</span>
                <span>Tap the <Share className="inline h-4 w-4 mx-1" /> Share button</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 rounded px-2 py-1 text-xs font-semibold">2</span>
                <span>Select &quot;Add to Home Screen&quot;</span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2 rounded-md border border-white/30 hover:bg-white/10 transition-colors text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome Install Prompt
  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-2xl z-50 animate-slide-up">
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
