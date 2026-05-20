import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import CreateEventDialog from '@/components/shared/CreateEventDialog'
import UpgradeBanner from '@/components/shared/UpgradeBanner'

interface Props {
  searchParams: Promise<{ upgraded?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { upgraded } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      members:event_members(count),
      guests:guests(id, has_plus_one)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier, plan_expires_at, full_name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'bun venit'

  return (
    <div className="space-y-8">
      {upgraded === 'true' && <UpgradeBanner tier={profile?.plan_tier ?? 'basic'} />}

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 font-medium tracking-wide uppercase mb-1">
            {new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-gray-900">
            Bună, <span className="italic font-normal text-rose-600">{firstName}</span>
          </h1>
        </div>
        <CreateEventDialog planTier={profile?.plan_tier ?? 'free'} eventCount={events?.length ?? 0} />
      </div>

      {/* Empty state — onboarding */}
      {(!events || events.length === 0) ? (
        <div className="space-y-6">
          {/* Hero card */}
          <div className="relative rounded-3xl overflow-hidden border border-stone-200 bg-white shadow-sm">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #e11d48 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e11d48 0%, transparent 50%)' }}
            />
            <div className="relative py-14 px-8 text-center space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-3xl">
                💍
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Bun venit la Nunta Mea!
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Creează primul eveniment și ești gata în câteva minute.
                </p>
              </div>
              <CreateEventDialog planTier={profile?.plan_tier ?? 'free'} eventCount={0} />
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                icon: '📋',
                title: 'Creează evenimentul',
                desc: 'Adaugă numele, data și locația nunții. Durează 30 de secunde.',
                done: false,
              },
              {
                step: '2',
                icon: '👥',
                title: 'Adaugă invitații',
                desc: 'Manual sau importă din Excel. Organizează-i pe categorii și urmărește RSVP-urile.',
                done: false,
              },
              {
                step: '3',
                icon: '🪑',
                title: 'Aranjează mesele',
                desc: 'Drag & drop vizual. Invită partenerul să colaboreze în timp real.',
                done: false,
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-sm font-bold text-rose-600">
                    {s.step}
                  </div>
                  <span className="text-xl">{s.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Discover features nudge */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Nu știi de unde să începi?</p>
            <Link href="/#features">
              <Button variant="outline" size="sm" className="text-xs rounded-full border-stone-200 text-gray-600 hover:border-rose-300 hover:text-rose-600">
                Descoperă funcțiile →
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Evenimente', value: events.length },
              { label: 'Total persoane', value: events.reduce((acc, e) => {
                const rows = (e.guests as unknown as { id: string; has_plus_one: boolean }[]) ?? []
                return acc + rows.reduce((s, g) => s + 1 + (g.has_plus_one ? 1 : 0), 0)
              }, 0) },
              { label: 'Colaboratori', value: events.reduce((acc, e) => acc + ((e.members as unknown as { count: number }[])?.[0]?.count ?? 0), 0) },
              { label: 'Plan', value: profile?.plan_tier === 'pro' ? 'Pro' : profile?.plan_tier === 'basic' ? 'Basic' : 'Gratuit' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-stone-200 px-5 py-4 shadow-sm">
                <p className="text-2xl font-[family-name:var(--font-playfair)] font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Event cards */}
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-gray-900 mb-4">
              Evenimentele mele
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event) => {
                const guestRows = (event.guests as unknown as { id: string; has_plus_one: boolean }[]) ?? []
                const guestCount = guestRows.reduce((s, g) => s + 1 + (g.has_plus_one ? 1 : 0), 0)
                const memberCount = (event.members as unknown as { count: number }[])?.[0]?.count ?? 0
                const steps = [
                  { label: 'Eveniment creat', done: true },
                  { label: `${guestCount} invitați adăugați`, done: guestCount > 0 },
                  { label: 'Colaborator invitat', done: memberCount > 1 },
                ]
                const nextAction = guestCount === 0 ? 'Adaugă primul invitat →' : 'Deschide →'
                return (
                  <Link key={event.id} href={`/events/${event.id}/guests`}>
                    <div className="group bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-200 overflow-hidden cursor-pointer h-full">
                      <div className="h-1.5 bg-gradient-to-r from-rose-400 to-rose-600" />
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-gray-900 leading-tight group-hover:text-rose-700 transition-colors">
                            {event.name}
                          </h3>
                          <span className="shrink-0 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                            {guestCount} inv.
                          </span>
                        </div>

                        {event.date && (
                          <p className="text-sm text-gray-400 font-medium">
                            {formatDate(event.date)}
                          </p>
                        )}

                        {event.venue && (
                          <p className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                            <span className="text-gray-300">—</span>
                            {event.venue}
                          </p>
                        )}

                        {/* Progress steps */}
                        <div className="flex items-center gap-2">
                          {steps.map((s, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${s.done ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-300'}`}>
                                {s.done ? '✓' : i + 1}
                              </span>
                              {i < steps.length - 1 && <span className={`w-5 h-px ${s.done ? 'bg-green-300' : 'bg-stone-200'}`} />}
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-gray-400">
                          <span>{memberCount} colaborator{memberCount !== 1 ? 'i' : ''}</span>
                          <span className={`font-medium transition-colors ${guestCount === 0 ? 'text-rose-500 group-hover:text-rose-700' : 'text-rose-400 group-hover:text-rose-600'}`}>
                            {nextAction}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Upgrade banner */}
      {profile?.plan_tier === 'free' && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 p-px shadow-lg shadow-rose-200">
          <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-white">
              <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold">Ești pe planul Gratuit</p>
              <p className="text-rose-100 text-sm mt-0.5">
                Fă upgrade pentru invitați nelimitați, PDF export și colaborare în timp real.
              </p>
            </div>
            <Link href="/upgrade" className="shrink-0">
              <Button className="bg-white text-rose-600 hover:bg-rose-50 font-semibold rounded-full px-6 shadow-none">
                Upgrade acum
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
