// Offline queue management using IndexedDB
// Stores user actions when offline and syncs when online

const DB_NAME = 'ChristiansInnovateOfflineQueue'
const DB_VERSION = 1
const QUEUE_STORE = 'actionQueue'

export interface QueuedAction {
  id?: number
  type: 'prayer_post' | 'comment' | 'reading_progress' | 'verse_note'
  data: any
  timestamp: number
  retries: number
  status: 'pending' | 'processing' | 'failed'
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Add an action to the offline queue
 */
export async function queueAction(
  type: QueuedAction['type'],
  data: any
): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const db = await openDB()
    const transaction = db.transaction([QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(QUEUE_STORE)

    const action: QueuedAction = {
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    }

    const request = store.add(action)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve({ success: true, id: request.result as number })
      }
      request.onerror = () => {
        reject({ success: false, error: request.error?.message })
      }
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error('Error queuing action:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get all pending actions from the queue
 */
export async function getPendingActions(): Promise<QueuedAction[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([QUEUE_STORE], 'readonly')
    const store = transaction.objectStore(QUEUE_STORE)
    const index = store.index('status')
    const request = index.getAll('pending')

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result)
      }
      request.onerror = () => {
        reject(request.error)
      }
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error('Error getting pending actions:', error)
    return []
  }
}

/**
 * Update action status
 */
export async function updateActionStatus(
  id: number,
  status: QueuedAction['status'],
  retries?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await openDB()
    const transaction = db.transaction([QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(QUEUE_STORE)
    const request = store.get(id)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const action = request.result
        if (action) {
          action.status = status
          if (retries !== undefined) {
            action.retries = retries
          }
          const updateRequest = store.put(action)
          updateRequest.onsuccess = () => resolve({ success: true })
          updateRequest.onerror = () =>
            reject({ success: false, error: updateRequest.error?.message })
        } else {
          resolve({ success: false, error: 'Action not found' })
        }
      }
      request.onerror = () => {
        reject({ success: false, error: request.error?.message })
      }
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error('Error updating action status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete an action from the queue
 */
export async function deleteAction(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await openDB()
    const transaction = db.transaction([QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(QUEUE_STORE)
    const request = store.delete(id)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve({ success: true })
      }
      request.onerror = () => {
        reject({ success: false, error: request.error?.message })
      }
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error('Error deleting action:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Process the queue - sync all pending actions with the server
 */
export async function processQueue(): Promise<{
  processed: number
  failed: number
  errors: string[]
}> {
  const actions = await getPendingActions()
  let processed = 0
  let failed = 0
  const errors: string[] = []

  for (const action of actions) {
    if (!action.id) continue

    try {
      // Update status to processing
      await updateActionStatus(action.id, 'processing')

      // Process based on action type
      let success = false
      switch (action.type) {
        case 'prayer_post':
          success = await syncPrayerPost(action.data)
          break
        case 'comment':
          success = await syncComment(action.data)
          break
        case 'reading_progress':
          success = await syncReadingProgress(action.data)
          break
        case 'verse_note':
          success = await syncVerseNote(action.data)
          break
      }

      if (success) {
        await deleteAction(action.id)
        processed++
      } else {
        const newRetries = action.retries + 1
        if (newRetries >= 3) {
          await updateActionStatus(action.id, 'failed', newRetries)
          failed++
          errors.push(`Failed to sync ${action.type} after 3 retries`)
        } else {
          await updateActionStatus(action.id, 'pending', newRetries)
        }
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Error processing ${action.type}: ${errorMsg}`)

      const newRetries = action.retries + 1
      if (newRetries >= 3) {
        await updateActionStatus(action.id, 'failed', newRetries)
        failed++
      } else {
        await updateActionStatus(action.id, 'pending', newRetries)
      }
    }
  }

  return { processed, failed, errors }
}

/**
 * Sync a prayer post to the server
 */
async function syncPrayerPost(data: any): Promise<boolean> {
  try {
    const response = await fetch('/api/sync/prayer-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.ok
  } catch (error) {
    console.error('Error syncing prayer post:', error)
    return false
  }
}

/**
 * Sync a comment to the server
 */
async function syncComment(data: any): Promise<boolean> {
  try {
    const response = await fetch('/api/sync/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.ok
  } catch (error) {
    console.error('Error syncing comment:', error)
    return false
  }
}

/**
 * Sync reading progress to the server
 */
async function syncReadingProgress(data: any): Promise<boolean> {
  try {
    const response = await fetch('/api/sync/reading-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.ok
  } catch (error) {
    console.error('Error syncing reading progress:', error)
    return false
  }
}

/**
 * Sync a verse note to the server
 */
async function syncVerseNote(data: any): Promise<boolean> {
  try {
    const response = await fetch('/api/sync/verse-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.ok
  } catch (error) {
    console.error('Error syncing verse note:', error)
    return false
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number
  processing: number
  failed: number
  total: number
}> {
  try {
    const db = await openDB()
    const transaction = db.transaction([QUEUE_STORE], 'readonly')
    const store = transaction.objectStore(QUEUE_STORE)
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const actions = request.result as QueuedAction[]
        const stats = {
          pending: actions.filter(a => a.status === 'pending').length,
          processing: actions.filter(a => a.status === 'processing').length,
          failed: actions.filter(a => a.status === 'failed').length,
          total: actions.length,
        }
        resolve(stats)
      }
      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error('Error getting queue stats:', error)
    return { pending: 0, processing: 0, failed: 0, total: 0 }
  }
}

/**
 * Clear all failed actions
 */
export async function clearFailedActions(): Promise<{ success: boolean; count: number }> {
  try {
    const db = await openDB()
    const transaction = db.transaction([QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(QUEUE_STORE)
    const index = store.index('status')
    const request = index.getAll('failed')

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const failedActions = request.result
        let count = 0

        failedActions.forEach((action: QueuedAction) => {
          if (action.id) {
            store.delete(action.id)
            count++
          }
        })

        transaction.oncomplete = () => {
          db.close()
          resolve({ success: true, count })
        }
      }
      request.onerror = () => reject({ success: false, count: 0 })
    })
  } catch (error) {
    console.error('Error clearing failed actions:', error)
    return { success: false, count: 0 }
  }
}
