import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RsvpPanel from '@/components/rsvp/RsvpPanel'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RsvpPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: responses } = await supabase
    .from('rsvp_responses')
    .select('*')
    .eq('event_id', id)
    .order('submitted_at', { ascending: false })

  return <RsvpPanel eventId={id} responses={responses ?? []} />
}
