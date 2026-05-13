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

  const { data: tables } = await supabase
    .from('tables')
    .select('*, guests(*)')
    .eq('event_id', id)
    .order('name')

  const { data: unassigned } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', id)
    .is('table_id', null)
    .neq('rsvp_status', 'declined')
    .order('name')

  const { data: member } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .single()

  const canEdit = member?.role === 'owner' || member?.role === 'editor'

  return (
    <TablePlanner
      eventId={id}
      initialTables={tables ?? []}
      initialUnassigned={unassigned ?? []}
      canEdit={canEdit}
    />
  )
}
