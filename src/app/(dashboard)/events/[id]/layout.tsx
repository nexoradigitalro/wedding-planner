import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EventTabs from '@/components/layout/EventTabs'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function EventLayout({ children, params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const [{ data: member }, { data: profile }] = await Promise.all([
    supabase.from('event_members').select('role').eq('event_id', id).eq('user_id', user.id).single(),
    supabase.from('profiles').select('plan_tier').eq('id', user.id).single(),
  ])

  if (!member && event.owner_id !== user.id) redirect('/dashboard')

  const role = member?.role ?? 'viewer'
  const planTier = profile?.plan_tier ?? 'free'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{event.name}</h1>
        {event.venue && <p className="text-muted-foreground text-sm">📍 {event.venue}</p>}
      </div>
      <EventTabs eventId={id} role={role} planTier={planTier} />
      <div>{children}</div>
    </div>
  )
}
