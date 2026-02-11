import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface PushSubscription {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

function validatePushSubscription(subscription: unknown): subscription is PushSubscription {
  if (!subscription || typeof subscription !== 'object') {
    return false
  }

  const sub = subscription as Record<string, unknown>

  // Validate endpoint
  if (typeof sub.endpoint !== 'string' || !sub.endpoint.trim()) {
    return false
  }

  // Validate keys object
  if (!sub.keys || typeof sub.keys !== 'object') {
    return false
  }

  const keys = sub.keys as Record<string, unknown>

  // Validate required cryptographic keys
  if (typeof keys.p256dh !== 'string' || !keys.p256dh.trim()) {
    return false
  }

  if (typeof keys.auth !== 'string' || !keys.auth.trim()) {
    return false
  }

  return true
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const subscription = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate subscription structure
    if (!validatePushSubscription(subscription)) {
      return NextResponse.json(
        { error: 'Invalid subscription format. Missing required fields: endpoint, keys.p256dh, or keys.auth' },
        { status: 400 }
      )
    }

    // Store subscription in database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: subscription,
        endpoint: subscription.endpoint,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error storing push subscription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in push subscription endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
