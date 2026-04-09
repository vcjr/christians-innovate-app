import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// In-memory rate limiter: 5 submissions per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 5
const store = new Map<string, number[]>()

function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  let timestamps = store.get(key) ?? []
  timestamps = timestamps.filter(t => t > cutoff)
  store.set(key, timestamps)

  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfterMs = timestamps[0] + WINDOW_MS - now
    return { allowed: false, retryAfterMs }
  }

  timestamps.push(now)
  return { allowed: true, retryAfterMs: 0 }
}

const VALID_TYPES = ['bug', 'feature', 'general']

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const { allowed, retryAfterMs } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  // Honeypot — bots fill hidden fields; humans don't
  if (body.website) {
    return NextResponse.json({ success: true })
  }

  const feedbackBody = typeof body.body === 'string' ? body.body.trim() : ''
  if (!feedbackBody) {
    return NextResponse.json({ error: 'Feedback body is required.' }, { status: 400 })
  }

  const type = VALID_TYPES.includes(body.type as string) ? body.type : 'general'

  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('feedback').insert({
      user_id: body.user_id || null,
      email: typeof body.email === 'string' ? body.email.trim() || null : null,
      app_slug: body.app_slug || null,
      type,
      subject: typeof body.subject === 'string' ? body.subject.trim() || null : null,
      body: feedbackBody,
      screenshot: typeof body.screenshot === 'string' ? body.screenshot : null,
      user_agent: body.user_agent || null,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/feedback] Insert failed:', (err as Error).message)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
