import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isPlanActive } from '@/lib/utils'
import type { PlanTier } from '@/types'
import DayProgram from '@/components/program/DayProgram'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProgramPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('name, date')
    .eq('id', id)
    .single()

  const { data: member } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier, plan_expires_at')
    .eq('id', user.id)
    .single()

  const { data: items } = await supabase
    .from('wedding_program')
    .select('*')
    .eq('event_id', id)
    .order('order_index', { ascending: true })
    .order('start_time', { ascending: true })

  const rawTier = (profile?.plan_tier ?? 'free') as PlanTier
  const planTier = isPlanActive(rawTier, profile?.plan_expires_at ?? null) ? rawTier : 'free'
  const role = member?.role ?? 'viewer'
  const canEdit = role === 'owner' || role === 'editor'

  return (
    <DayProgram
      eventId={id}
      eventName={event?.name ?? ''}
      eventDate={event?.date ?? null}
      initialItems={items ?? []}
      canEdit={canEdit}
      planTier={planTier}
    />
  )
}
