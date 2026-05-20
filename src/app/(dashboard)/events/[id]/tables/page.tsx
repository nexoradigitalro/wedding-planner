import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TablePlanner from '@/components/tables/TablePlanner'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TablesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: tables },
    { data: unassigned },
    { data: member },
    { data: profile },
    { data: venueElements },
  ] = await Promise.all([
    supabase.from('tables').select('*, guests(*)').eq('event_id', id).order('name'),
    supabase.from('guests').select('*').eq('event_id', id).is('table_id', null).neq('rsvp_status', 'declined').order('name'),
    supabase.from('event_members').select('role').eq('event_id', id).eq('user_id', user.id).single(),
    supabase.from('profiles').select('plan_tier').eq('id', user.id).single(),
    supabase.from('venue_elements').select('*').eq('event_id', id).order('created_at'),
  ])

  const canEdit = member?.role === 'owner' || member?.role === 'editor'

  return (
    <TablePlanner
      eventId={id}
      userId={user.id}
      initialTables={tables ?? []}
      initialUnassigned={unassigned ?? []}
      initialVenueElements={venueElements ?? []}
      canEdit={canEdit}
      planTier={profile?.plan_tier ?? 'free'}
    />
  )
}
