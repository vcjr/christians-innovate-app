'use client'

import { useState, useEffect } from 'react'
import { Download, Trash2, CheckCircle, HardDrive, RefreshCw, Loader2 } from 'lucide-react'
import {
  getCachedTranslations,
  downloadTranslationForOffline,
  removeCachedTranslation,
  getStorageInfo,
} from '@/utils/bible-offline'
import { BIBLE_TRANSLATIONS, type TranslationKey } from '@/utils/bible-constants'
import {
  resetInstallPromptDismissal,
  isInstallPromptDismissed,
  getDaysUntilPromptReappears,
} from '@/utils/install-prompt'

export function AppSettingsForm() {
  const [cachedTranslations, setCachedTranslations] = useState<string[]>([])
  const [downloadingTranslation, setDownloadingTranslation] = useState<string | null>(null)
  const [storageInfo, setStorageInfo] = useState<{
    usage: number
    quota: number
    percentUsed: number
  } | null>(null)
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false)
  const [daysUntilPrompt, setDaysUntilPrompt] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load cached translations and install prompt state on mount
  useEffect(() => {
    async function loadOfflineData() {
      const cached = await getCachedTranslations()
      setCachedTranslations(cached)

      const storage = await getStorageInfo()
      setStorageInfo(storage)

      // Check install prompt state
      setInstallPromptDismissed(isInstallPromptDismissed())
      setDaysUntilPrompt(getDaysUntilPromptReappears())
    }
    loadOfflineData()
  }, [])

  const translationNames: Record<string, string> = {
    KJV: 'King James Version',
    NKJV: 'New King James Version',
    ESV: 'English Standard Version',
    NIV: 'New International Version',
    NLT: 'New Living Translation',
    NASB: 'New American Standard Bible',
    MSG: 'The Message',
  }

  async function handleDownloadTranslation(translation: string) {
    setDownloadingTranslation(translation)
    const result = await downloadTranslationForOffline(translation as TranslationKey)

    if (result.success) {
      const cached = await getCachedTranslations()
      setCachedTranslations(cached)

      const storage = await getStorageInfo()
      setStorageInfo(storage)

      setMessage({ type: 'success', text: `${translation} downloaded for offline use` })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to download translation' })
    }

    setDownloadingTranslation(null)
  }

  async function handleRemoveTranslation(translation: string) {
    const result = await removeCachedTranslation(translation as TranslationKey)

    if (result.success) {
      const cached = await getCachedTranslations()
      setCachedTranslations(cached)

      const storage = await getStorageInfo()
      setStorageInfo(storage)

      setMessage({ type: 'success', text: `${translation} removed from offline storage` })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to remove translation' })
    }
  }

  function handleResetInstallPrompt() {
    resetInstallPromptDismissal()
    setInstallPromptDismissed(false)
    setDaysUntilPrompt(null)
    setMessage({
      type: 'success',
      text: 'Install prompt has been reset. Refresh the page to see it again.',
    })
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Offline Downloads Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Offline Bible Access</h2>
          <p className="text-sm text-gray-600 mb-4">Download Bible translations for offline reading</p>
        </div>

        {/* Storage Info */}
        {storageInfo && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Storage Used</span>
              </div>
              <span className="text-sm text-gray-600">
                {formatBytes(storageInfo.usage)} of {formatBytes(storageInfo.quota)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${storageInfo.percentUsed > 80
                    ? 'bg-red-600'
                    : storageInfo.percentUsed > 50
                      ? 'bg-yellow-600'
                      : 'bg-blue-600'
                  }`}
                style={{ width: `${Math.min(storageInfo.percentUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {storageInfo.percentUsed.toFixed(1)}% used
            </p>
          </div>
        )}

        {/* Translation Downloads */}
        <div className="space-y-2 mb-4">
          {Object.entries(BIBLE_TRANSLATIONS).map(([key]) => {
            const isCached = cachedTranslations.includes(key)
            const isDownloading = downloadingTranslation === key

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition"
              >
                <div className="flex items-center gap-3">
                  {isCached ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{key}</p>
                    <p className="text-sm text-gray-500">{translationNames[key]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCached ? (
                    <>
                      <span className="text-xs text-green-600 font-medium">Downloaded</span>
                      <button
                        onClick={() => handleRemoveTranslation(key)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove from offline storage"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDownloadTranslation(key)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Each translation is approximately 5-6 MB. Downloaded translations will be available for reading even when you&apos;re offline.
          </p>
        </div>
      </div>

      {/* App Installation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">App Installation</h2>
        <p className="text-sm text-gray-600 mb-4">
          Install Christians Innovate on your device for a native app experience
        </p>

        <div className="space-y-4">
          {installPromptDismissed ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3">
                You previously dismissed the install prompt.
                {daysUntilPrompt !== null && daysUntilPrompt > 0 && (
                  <span className="text-gray-500">
                    {' '}It will appear again in {daysUntilPrompt} day{daysUntilPrompt !== 1 ? 's' : ''}.
                  </span>
                )}
              </p>
              <button
                onClick={handleResetInstallPrompt}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Show Install Prompt Again
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Install prompt is enabled.</strong> You&apos;ll see the installation banner when you visit the app.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
