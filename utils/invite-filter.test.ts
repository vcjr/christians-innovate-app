import { describe, it, expect } from '@jest/globals';
import { filterInviteCandidates, InviteCandidate } from './invite-filter';

const candidates: InviteCandidate[] = [
  { user_id: '1', full_name: 'John Doe', avatar_url: null },
  { user_id: '2', full_name: 'Jane Smith', avatar_url: null },
  { user_id: '3', full_name: 'Johnny Appleseed', avatar_url: null },
  { user_id: '4', full_name: null, avatar_url: null },
];

describe('filterInviteCandidates', () => {
  it('returns an empty list for a blank query', () => {
    expect(filterInviteCandidates(candidates, '')).toEqual([]);
    expect(filterInviteCandidates(candidates, '   ')).toEqual([]);
  });

  it('matches names case-insensitively', () => {
    const result = filterInviteCandidates(candidates, '  JOHN ');
    expect(result.map(c => c.user_id)).toEqual(['1', '3']);
  });

  it('excludes the given user ids', () => {
    const result = filterInviteCandidates(candidates, 'john', ['1']);
    expect(result.map(c => c.user_id)).toEqual(['3']);
  });

  it('skips candidates without a name', () => {
    const result = filterInviteCandidates(candidates, 'n');
    expect(result.some(c => c.user_id === '4')).toBe(false);
  });

  it('limits the number of results', () => {
    const result = filterInviteCandidates(candidates, 'j', [], 2);
    expect(result).toHaveLength(2);
  });
});
