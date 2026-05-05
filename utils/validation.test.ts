import { describe, it, expect } from '@jest/globals';
import { validateUrls } from './validation';

describe('validateUrls Utility', () => {
  it('returns null for valid URLs', () => {
    const data = { website_url: 'https://christiansinnovate.com' };
    expect(validateUrls(data)).toBeNull();
  });

  it('returns an error string for malformed URLs', () => {
    const data = { linkedin_url: 'not-a-url' };
    expect(validateUrls(data)).toContain('Invalid URL');
  });

  it('ignores empty strings or nulls (optional fields)', () => {
    const data = { twitter_url: '', facebook_url: undefined };
    expect(validateUrls(data)).toBeNull();
  });

  it('validates multiple URL fields', () => {
    const data = { 
      website_url: 'https://valid.com', 
      linkedin_url: 'invalid' 
    };
    expect(validateUrls(data)).toContain('linkedin_url');
  });
});