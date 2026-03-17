/** @jest-environment node */

// Pillar: Maintenance - Localized polyfill for structuredClone.
// Required for fake-indexeddb to serialize complex binary objects in JSDOM.
import 'core-js/full/structured-clone';

// Pillar: Performance - Use in-memory polyfill for fast, isolated database testing
import 'fake-indexeddb/auto';
import { setPersistedFile, getPersistedFile, clearPersistedFile, clearAllPersistedFiles } from './filePersistence';

describe('filePersistence Utility (IndexedDB)', () => {
  const mockFile = new File(['content'], 'test.png', { type: 'image/png', lastModified: Date.now() });
  const storageKey = 'test-avatar';

  beforeEach(async () => {
    await clearPersistedFile(storageKey);
  });

  it('successfully saves and retrieves a binary File object', async () => {
    // Pillar: Performance - Binary storage avoids expensive Base64 conversion
    await setPersistedFile(storageKey, mockFile);

    const retrievedFile = await getPersistedFile(storageKey);
    
    expect(retrievedFile).toBeInstanceOf(File);
    expect(retrievedFile?.name).toBe(mockFile.name);
    expect(retrievedFile?.type).toBe(mockFile.type);
    expect(retrievedFile?.size).toBe(mockFile.size);

    // Verify binary content integrity
    const text = await retrievedFile?.text();
    expect(text).toBe('content');
  });

  it('returns null when attempting to retrieve a non-existent key', async () => {
    const result = await getPersistedFile('non-existent');
    expect(result).toBeNull();
  });

  it('successfully clears a persisted file', async () => {
    await setPersistedFile(storageKey, mockFile);
    await clearPersistedFile(storageKey);

    const result = await getPersistedFile(storageKey);
    expect(result).toBeNull();
  });

  it('successfully clears multiple files at once (Bulk Deletion Requirement)', async () => {
    // Pillar: Security/Privacy - Ensure no orphaned files remain
    await setPersistedFile('key1', mockFile);
    await setPersistedFile('key2', mockFile);
    await setPersistedFile('key3', mockFile);
    
    await clearAllPersistedFiles();

    expect(await getPersistedFile('key1')).toBeNull();
    expect(await getPersistedFile('key2')).toBeNull();
    expect(await getPersistedFile('key3')).toBeNull();
  });

  it('handles concurrent storage requests correctly (Singleton Integrity)', async () => {
    // Pillar: Performance - Verify that multiple calls don't cause race conditions
    const file1 = new File(['1'], '1.png', { type: 'image/png' });
    const file2 = new File(['2'], '2.png', { type: 'image/png' });

    await Promise.all([
      setPersistedFile('concurrent1', file1),
      setPersistedFile('concurrent2', file2)
    ]);

    const res1 = await getPersistedFile('concurrent1');
    const res2 = await getPersistedFile('concurrent2');

    expect(await res1?.text()).toBe('1');
    expect(await res2?.text()).toBe('2');
  });

  it('rejects the promise when a transaction is aborted (Error Propagation)', async () => {
    // Pillar: Reliability - Ensure the hook can catch storage failures
    // Pillar: Maintenance - Mock the prototype to affect the singleton instance held by the utility
    const transactionSpy = jest.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    await expect(clearAllPersistedFiles()).rejects.toThrow('QuotaExceededError');
    
    transactionSpy.mockRestore();
  });

  it('resolves silently if IndexedDB is not available (SSR Safety)', async () => {
    // Pillar: Maintenance - Ensure the utility doesn't crash in Node/SSR environments
    const originalIndexedDB = global.indexedDB;
    // @ts-ignore - Simulating non-browser environment
    delete global.indexedDB;

    await expect(clearAllPersistedFiles()).resolves.toBeUndefined();
    global.indexedDB = originalIndexedDB;
  });

  it('overwrites existing files when saving to the same key', async () => {
    const secondFile = new File(['new content'], 'new.png', { type: 'image/png', lastModified: Date.now() });
    
    await setPersistedFile(storageKey, mockFile);
    await setPersistedFile(storageKey, secondFile);

    const result = await getPersistedFile(storageKey);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('new.png');
  });
});