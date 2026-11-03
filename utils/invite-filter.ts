export interface InviteCandidate {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Filters users that can be invited to a group by a search query.
 * Excludes any user in `excludedUserIds` (e.g. current members) and
 * matches the query case-insensitively against the user's full name.
 * Returns an empty list for a blank query.
 */
export function filterInviteCandidates(
  candidates: InviteCandidate[],
  query: string,
  excludedUserIds: Iterable<string> = [],
  limit = 10
): InviteCandidate[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const excluded = new Set(excludedUserIds);
  const results: InviteCandidate[] = [];

  for (const candidate of candidates) {
    if (excluded.has(candidate.user_id)) continue;
    if (!candidate.full_name?.toLowerCase().includes(term)) continue;
    results.push(candidate);
    if (results.length >= limit) break;
  }

  return results;
}
