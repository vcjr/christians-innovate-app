import { renderHook, act } from '@testing-library/react';
import { useFormPersistence } from './useFormPersistence';
import { setPersistedFile, getPersistedFile, clearAllPersistedFiles } from '@/utils/storage/filePersistence';

jest.mock('@/utils/storage/filePersistence', () => ({
  setPersistedFile: jest.fn().mockResolvedValue(undefined),
  getPersistedFile: jest.fn().mockResolvedValue(null),
  clearAllPersistedFiles: jest.fn().mockResolvedValue(undefined),
}));

describe('useFormPersistence', () => {
  const DATA_KEY = 'test_form_data';
  const STORAGE_KEY = `form_persistence_${DATA_KEY}`;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should save serializable data to localStorage', () => {
    const { result } = renderHook(() => useFormPersistence({ key: DATA_KEY }));
    
    act(() => {
      result.current.save({ name: 'John' });
    });

    // Pillar: Maintenance - Assert using the internal prefixed key
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(saved.name).toBe('John');
  });

  it('should save binary files to IndexedDB', async () => {
    // Functional: Must provide fileFields so the hook knows which keys are binary
    const { result } = renderHook(() => useFormPersistence({ 
      key: DATA_KEY,
      fileFields: ['avatar'] 
    }));
    const file = new File([''], 'test.png');

    await act(async () => {
      await result.current.save({ avatar: file });
    });

    expect(setPersistedFile).toHaveBeenCalledWith('avatar', file);
  });

  it('should rehydrate data from both sources', async () => {
    // Pillar: Reliability - Pre-seed localStorage with the correct prefix
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bio: 'Hello' }));
    const mockFile = new File([''], 'avatar.png');
    (getPersistedFile as jest.Mock).mockResolvedValue(mockFile);

    interface TestData {
      bio: string;
      avatar: File;
    }

    const { result } = renderHook(() => useFormPersistence({ 
      key: DATA_KEY,
      fileFields: ['avatar'] 
    }));

    // Pillar: Type Safety - Avoid 'any' by defining the expected structure
    let rehydrated: Partial<TestData> = {};
    await act(async () => {
      rehydrated = await result.current.rehydrate();
    });

    expect(rehydrated.bio).toBe('Hello');
    expect(rehydrated.avatar).toBe(mockFile);
  });

  it('should clear all storage on request', async () => {
    // Functional: Manually set an item to ensure clear() actually removes something
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ someData: 'to be cleared' }));
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    const { result } = renderHook(() => useFormPersistence({ key: DATA_KEY }));
    await act(async () => {
      await result.current.clear();
    });
    // Pillar: Security - Verify the prefixed key is actually removed
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    // Functional: Verify that the file persistence cleanup was also triggered
    expect(clearAllPersistedFiles).toHaveBeenCalledTimes(1);
  });
});