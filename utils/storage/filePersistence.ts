/**
 * @file filePersistence.ts
 * @description Promise-based wrapper for IndexedDB to persist binary File objects.
 * Pillar: Performance - Binary storage is significantly faster than Base64 stringification.
 * Pillar: Maintenance - SSR guards ensure safety in Next.js/Node environments.
 */

const DB_NAME = 'OnboardingStorage';
const STORE_NAME = 'files';
const DB_VERSION = 1;

/**
 * Singleton promise to ensure only one connection is opened.
 * Pillar: Performance - Reusing the same connection is faster and prevents race conditions.
 */
let dbPromise: Promise<IDBDatabase | null> | null = null;

/**
 * SSR Guard: Checks if IndexedDB is available in the current environment.
 * @returns {boolean}
 */
const isIndexedDBAvailable = (): boolean => {
  // Pillar: Maintenance - Check global scope for indexedDB to support both browsers and test polyfills
  return typeof indexedDB !== 'undefined';
};

/**
 * Opens the IndexedDB database and ensures the object store exists.
 * @returns {Promise<IDBDatabase | null>}
 */
const openDB = (): Promise<IDBDatabase | null> => {
  if (!isIndexedDBAvailable()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME).createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null; // Allow retry on next call if opening fails
      reject(request.error);
    };
  });

  return dbPromise;
};

/**
 * Persists a File object to IndexedDB.
 * @param {string} key - The unique identifier for the file.
 * @param {File} file - The binary file object to store.
 */
export const setPersistedFile = async (key: string, file: File): Promise<void> => {
  try {
    const db = await openDB();
    if (!db) return;

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(file, key);

      // Pillar: Performance/Maintenance - Resolve only when the transaction is fully committed
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  } catch (error) {
    console.error('IndexedDB set error:', error);
    throw error;
  }
};

/**
 * Retrieves a persisted File object from IndexedDB.
 * @param {string} key - The unique identifier for the file.
 * @returns {Promise<File | null>}
 */
export const getPersistedFile = async (key: string): Promise<File | null> => {
  try {
    const db = await openDB();
    if (!db) return null;

    return await new Promise<File | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      // Pillar: Type Safety - Ensure we return a File or null, never undefined
      request.onsuccess = () => {
        resolve((request.result as File) || null);
      };
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  } catch (error) {
    console.error('IndexedDB get error:', error);
    throw error;
  }
};

/**
 * Removes a file from IndexedDB.
 */
export const clearPersistedFile = async (key: string): Promise<void> => {
  try {
    const db = await openDB();
    if (!db) return;

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  } catch (error) {
    console.error('IndexedDB delete error:', error);
    throw error;
  }
};

/**
 * Wipes the entire onboarding file store.
 * Pillar: Security/Privacy - Essential for clearing data on sign-out.
 */
export const clearAllPersistedFiles = async (): Promise<void> => {
  try {
    const db = await openDB();
    if (!db) return;

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  } catch (error) {
    console.error('IndexedDB clear error:', error);
    throw error; // Re-throw so the hook can handle the loading state transition
  }
};