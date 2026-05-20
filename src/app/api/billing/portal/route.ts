import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  const customerId = (profile as { stripe_customer_id?: string | null })?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ error: 'no_customer' }, { status: 404 })
  }

  const { returnUrl } = await request.json().catch(() => ({}))
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
  })

  return NextResponse.json({ url: session.url })
}
