import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.supabase_user_id
    const plan = session.metadata?.plan as 'basic' | 'pro'

    console.log('[webhook] checkout.session.completed', { userId, plan })

    if (!userId || !plan) {
      console.error('[webhook] missing userId or plan in metadata')
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('profiles').update({
      plan_tier: plan,
      plan_expires_at: expiresAt.toISOString(),
      stripe_customer_id: session.customer ?? null,
    }).eq('id', userId)

    if (error) console.error('[webhook] supabase update failed', error)
    else console.log('[webhook] plan updated to', plan, 'for user', userId)
  }

  return NextResponse.json({ ok: true })
}
