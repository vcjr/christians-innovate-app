'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface FilePreviewHook {
  /**
   * Generates a Blob URL for a given File object and manages its lifecycle.
   * @param {string} key - A unique key to identify the file (e.g., 'avatar', 'document').
   * @param {File | null} file - The File object to create a preview for. Pass null to clear.
   * @returns {string | null} The Blob URL for the file, or null if no file is provided.
   */
  getPreview: (key: string, file: File | null) => string | null;
  /**
   * Clears a specific file preview and revokes its Blob URL.
   * @param {string} key - The key of the file preview to clear.
   */
  clearPreview: (key: string) => void;
}

/**
 * @function useFilePreview
 * @description A generic hook for creating and managing Blob URLs for file previews,
 * ensuring proper revocation to prevent memory leaks.
 * @returns {FilePreviewHook} An object containing functions to manage file previews.
 */
export const useFilePreview = (): FilePreviewHook => {
  // Stores active Blob URLs, keyed by a unique identifier
  const activeBlobs = useRef<Record<string, string>>({});

  const getPreview = useCallback((key: string, file: File | null): string | null => {
    // Revoke previous URL for this key if it exists
    if (activeBlobs.current[key]) {
      URL.revokeObjectURL(activeBlobs.current[key]);
      delete activeBlobs.current[key];
    }

    if (file) {
      const blobUrl = URL.createObjectURL(file);
      activeBlobs.current[key] = blobUrl;
      return blobUrl;
    }
    return null;
  }, []);

  const clearPreview = useCallback((key: string) => {
    getPreview(key, null); // Use getPreview with null to revoke and clear
  }, [getPreview]);

  // Revoke all Blob URLs when the component unmounts
  useEffect(() => {
    return () => {
      Object.values(activeBlobs.current).forEach(url => URL.revokeObjectURL(url));
      activeBlobs.current = {};
    };
  }, []);

  return { getPreview, clearPreview };
};