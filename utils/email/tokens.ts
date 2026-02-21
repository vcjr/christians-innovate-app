import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface UnsubscribeTokenPayload {
  userId: string
  email: string
}

/**
 * Generate an unsubscribe token for a user
 * @param userId - The user's ID
 * @param email - The user's email address
 * @returns A signed JWT token
 */
export function generateUnsubscribeToken(
  userId: string,
  email: string
): string {
  const payload: UnsubscribeTokenPayload = {
    userId,
    email,
  }

  // Token expires in 1 year
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' })
}

/**
 * Verify and decode an unsubscribe token
 * @param token - The JWT token to verify
 * @returns The decoded payload or null if invalid
 */
export function verifyUnsubscribeToken(
  token: string
): UnsubscribeTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UnsubscribeTokenPayload
    return decoded
  } catch (error) {
    console.error('Failed to verify unsubscribe token:', error)
    return null
  }
}

/**
 * Generate an unsubscribe URL for a user
 * @param userId - The user's ID
 * @param email - The user's email address
 * @param baseUrl - The base URL of the application (optional, defaults to NEXT_PUBLIC_SITE_URL)
 * @returns The complete unsubscribe URL
 */
export function generateUnsubscribeUrl(
  userId: string,
  email: string,
  baseUrl?: string
): string {
  const token = generateUnsubscribeToken(userId, email)
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${siteUrl}/unsubscribe/${token}`
}
