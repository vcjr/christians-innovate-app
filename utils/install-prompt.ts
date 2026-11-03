// Utility functions for managing PWA install prompt state

/**
 * Reset the install prompt dismissal
 * This allows the user to see the install prompt again
 */
export function resetInstallPromptDismissal(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pwa-install-dismissed')
  }
}

/**
 * Check if the install prompt is currently dismissed
 */
export function isInstallPromptDismissed(): boolean {
  if (typeof window === 'undefined') return false

  const dismissedData = localStorage.getItem('pwa-install-dismissed')
  if (!dismissedData) return false

  try {
    const dismissedTime = parseInt(dismissedData, 10)
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const now = Date.now()

    return now - dismissedTime < thirtyDaysInMs
  } catch {
    return false
  }
}

/**
 * Get the number of days until the install prompt will be shown again
 */
export function getDaysUntilPromptReappears(): number | null {
  if (typeof window === 'undefined') return null

  const dismissedData = localStorage.getItem('pwa-install-dismissed')
  if (!dismissedData) return null

  try {
    const dismissedTime = parseInt(dismissedData, 10)
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const timeRemaining = dismissedTime + thirtyDaysInMs - now

    if (timeRemaining <= 0) return 0

    return Math.ceil(timeRemaining / (24 * 60 * 60 * 1000))
  } catch {
    return null
  }
}
