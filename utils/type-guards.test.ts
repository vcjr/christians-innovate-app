import { isFile } from './type-guards';

describe('Type Guards Utility', () => {
  it('should return true for a valid File object', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    expect(isFile(file)).toBe(true);
  });

  it('should return false for a string', () => {
    expect(isFile('not a file')).toBe(false);
  });

  it('should return false for null or undefined', () => {
    expect(isFile(null)).toBe(false);
    expect(isFile(undefined)).toBe(false);
  });

  it('should return false for a plain object', () => {
    expect(isFile({ name: 'test.png', size: 1024 })).toBe(false);
  });

  it('should return false for a number', () => {
    expect(isFile(123)).toBe(false);
  });
});