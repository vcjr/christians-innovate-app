'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { setPersistedFile, getPersistedFile, clearAllPersistedFiles } from '@/utils/storage/filePersistence';
import { isFile } from '@/utils/type-guards';

interface UseFormPersistenceOptions<T> {
  key: string; // Unique key for localStorage
  fileFields?: (keyof T)[]; // Array of field names that store File objects
  initialData?: T;
}

interface UseFormPersistenceResult<T> {
  /**
   * Saves serializable data to localStorage and binary files to IndexedDB.
   * @param {Partial<T>} data - The data to save.
   */
  save: (data: Partial<T>) => Promise<void>;
  /**
   * Rehydrates data from localStorage and IndexedDB.
   * @returns {Promise<Partial<T>>} The rehydrated data.
   */
  rehydrate: () => Promise<Partial<T>>;
  /**
   * Clears all persisted data for this key from localStorage and IndexedDB.
   */
  clear: () => Promise<void>;
}

/**
 * @function useFormPersistence
 * @description A generic hook for persisting form data to localStorage (for serializable data)
 * and IndexedDB (for File objects), providing rehydration and cleanup capabilities.
 * @param {UseFormPersistenceOptions<T>} options - Configuration options for persistence.
 * @returns {UseFormPersistenceResult<T>} An object containing persistence functions.
 */
export const useFormPersistence = <T extends Record<string, any>>({
  key,
  fileFields = [],
  initialData = {} as T,
}: UseFormPersistenceOptions<T>): UseFormPersistenceResult<T> => {
  const localStorageKey = `form_persistence_${key}`;

  const save = useCallback(async (data: Partial<T>) => {
    const serializableData: Partial<T> = {};
    const filePromises: Promise<void>[] = [];

    for (const fieldName in data) {
      const value = data[fieldName];
      if (fileFields.includes(fieldName) && isFile(value)) {
        filePromises.push(setPersistedFile(fieldName as string, value));
      } else {
        serializableData[fieldName] = value;
      }
    }

    const currentData = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
    localStorage.setItem(localStorageKey, JSON.stringify({ ...currentData, ...serializableData }));

    await Promise.all(filePromises);
  }, [localStorageKey, fileFields]);

  const rehydrate = useCallback(async (): Promise<Partial<T>> => {
    const savedData = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
    const rehydratedFiles: Partial<T> = {};

    for (const fieldName of fileFields) {
      const file = await getPersistedFile(fieldName as string);
      if (file) {
        rehydratedFiles[fieldName] = file as T[keyof T];
      }
    }

    return { ...initialData, ...savedData, ...rehydratedFiles };
  }, [localStorageKey, fileFields, initialData]);

  const clear = useCallback(async () => {
    localStorage.removeItem(localStorageKey);
    await clearAllPersistedFiles(); // Clears all files, assuming fileFields are unique to this form
  }, [localStorageKey]);

  return { save, rehydrate, clear };
};