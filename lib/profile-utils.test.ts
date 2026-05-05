import { describe, it, expect } from '@jest/globals';
import { sanitizeProfileData } from './profile-utils';

describe('sanitizeProfileData Logic', () => {
  it('trims whitespace from full_name and bio', () => {
    const input = { 
      full_name: '  John Doe  ', 
      bio: '\nHello World\t' 
    };
    const result = sanitizeProfileData(input);
    
    expect(result.full_name).toBe('John Doe');
    expect(result.bio).toBe('Hello World');
  });

  it('adds a valid updated_at timestamp', () => {
    const result = sanitizeProfileData({});
    expect(result.updated_at).toBeDefined();
    // Verify it's an ISO string
    expect(new Date(result.updated_at!).toISOString()).toBe(result.updated_at);
  });
});