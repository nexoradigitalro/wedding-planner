import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GiftCalculator from '@/components/gifts/GiftCalculator'
import { PLAN_LIMITS } from '@/types'
import { isPlanActive } from '@/lib/utils'
import type { PlanTier } from '@/types'
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
    .select('plan_tier, plan_expires_at')
    .eq('id', user.id)
    .single()

  const rawTier = (profile?.plan_tier ?? 'free') as PlanTier
  const planTier = isPlanActive(rawTier, profile?.plan_expires_at ?? null) ? rawTier : 'free'
  const limits = PLAN_LIMITS[planTier]

  if (!limits.giftCalculator) {
    return (
      <div className="max-w-lg mx-auto py-10 space-y-6">
        <div className="rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-950 to-stone-900 flex flex-col p-8 space-y-5">
          <span className="inline-block text-xs font-bold bg-rose-600 text-white px-3 py-1 rounded-full w-fit">Exclusiv Pro</span>
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white">Calculator Cinste</h3>
            <p className="text-stone-400 text-sm mt-2 leading-relaxed">Marchezi cine a fost prezent, introduci cinstea în RON și aplicația îți calculează automat totalul și media per invitație.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Total colectat', value: '14.200 RON', color: 'text-white' },
                { label: 'Prezenți', value: '68', color: 'text-green-400' },
                { label: 'Medie', value: '790 RON', color: 'text-rose-400' },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-xl p-2.5 text-center">
                  <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {[
              { name: 'Familia Popescu', present: true, gift: '1.000' },
              { name: 'Ion & Maria', present: true, gift: '800' },
              { name: 'Andrei Constantin', present: false, gift: null },
              { name: 'Familia Ionescu', present: true, gift: '500' },
            ].map((row) => (
              <div key={row.name} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${row.present ? 'bg-green-400' : 'bg-stone-600'}`} />
                <span className={`flex-1 truncate ${row.present ? 'text-stone-300' : 'text-stone-600 line-through'}`}>{row.name}</span>
                <span className={`font-semibold shrink-0 ${row.present ? 'text-rose-300' : 'text-stone-600'}`}>{row.gift ? `${row.gift} RON` : '—'}</span>
              </div>
            ))}
          </div>
          <Link href="/upgrade?autostart=pro">
            <Button className="bg-rose-600 hover:bg-rose-700 rounded-full font-semibold text-sm px-6 w-full">
              Activează Pro — 109 RON
            </Button>
          </Link>
          <p className="text-xs text-stone-500 text-center -mt-2">O singură plată · Fără abonament</p>
        </div>
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
