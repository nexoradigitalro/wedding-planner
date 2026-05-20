import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GiftCalculator from '@/components/gifts/GiftCalculator'
import { PLAN_LIMITS } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CinstePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', user.id)
    .single()

  const limits = PLAN_LIMITS[profile?.plan_tier ?? 'free']

  if (!limits.giftCalculator) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-5">
        <div className="text-5xl">🎁</div>
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900">
          Calculator Cinste
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Marchează cine a fost prezent, înregistrează cinstea primită și vezi totalul colectat în timp real.
          Disponibil în planul <strong>Pro</strong>.
        </p>
        <Link href="/upgrade?autostart=pro">
          <Button className="bg-rose-600 hover:bg-rose-700 px-8">
            Activează Pro — 109 RON
          </Button>
        </Link>
        <p className="text-xs text-gray-400">O singură plată · Fără abonament</p>
      </div>
    )
  }

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', id)
    .eq('rsvp_status', 'confirmed')
    .order('name')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Calculator Cinste</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Marchează prezența și înregistrează cinstea primită de la fiecare invitat confirmat.
        </p>
      </div>
      <GiftCalculator eventId={id} initialGuests={guests ?? []} />
    </div>
  )
}
