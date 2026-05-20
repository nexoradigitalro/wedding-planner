import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GuestList from '@/components/guests/GuestList'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GuestsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: guests } = await supabase
    .from('guests')
    .select('*, table:tables(id, name)')
    .eq('event_id', id)
    .order('name')

  const { data: tables } = await supabase
    .from('tables')
    .select('id, name, capacity')
    .eq('event_id', id)
    .order('name')

  const { data: member } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', user.id)
    .single()

  const role = member?.role ?? 'viewer'
  const canEdit = role === 'owner' || role === 'editor'

  return (
    <GuestList
      eventId={id}
      userId={user.id}
      initialGuests={guests ?? []}
      tables={tables ?? []}
      canEdit={canEdit}
      planTier={profile?.plan_tier ?? 'free'}
    />
  )
}
