import React, { useState, useEffect, useRef } from 'react';
import FieldLayout from '../FieldLayout/FieldLayout';
import { getPersistedFile, setPersistedFile } from '@/utils/storage/filePersistence';

interface PhotoInputProps {
  label: string;
  name: string;
  onChange: (file: File | null) => void;
  error?: string | null;
  placeholder?: string;
}

/**
 * @function PhotoInput
 * @description A specialized input for selecting and previewing photos.
 *              Handles local Blob URL creation and cleanup for performance.
 */
const PhotoInput: React.FC<PhotoInputProps> = ({ label, name, onChange, error, placeholder }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pillar: Maintenance - Restore file from IndexedDB on mount to survive hard refresh
  useEffect(() => {
    const restoreFile = async () => {
      const savedFile = await getPersistedFile(name);
      if (savedFile) {
        const url = URL.createObjectURL(savedFile);
        setPreviewUrl(url);
        // Notify parent state of the restored file
        onChange(savedFile);
      }
    };

    restoreFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]); // Only run on mount or if name changes

  // Pillar: Performance - Cleanup Blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // Pillar: Scalability - Mirror selection to IndexedDB for persistence
    if (file) setPersistedFile(name, file);

    onChange(file);
  };

  return (
    <FieldLayout
      label={label}
      error={error}
      isGroup={false} // Pillar: A11y - Standard div/label for single file input
      renderInput={(layoutProps) => (
        <div className="flex flex-col gap-4">
          {previewUrl && (
            <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <input
            {...layoutProps}
            type="file"
            name={name}
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${layoutProps.errorClassName}`}
          />
        </div>
      )}
    />
  );
};

export default PhotoInput;