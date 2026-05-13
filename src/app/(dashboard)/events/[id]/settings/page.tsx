import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventSettings from '@/components/shared/EventSettings'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  const { data: member } = await supabase.from('event_members').select('role').eq('event_id', id).eq('user_id', user.id).single()

  if (member?.role !== 'owner') redirect(`/events/${id}/guests`)

  return <EventSettings event={event} />
}
