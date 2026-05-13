import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CollaboratePanel from '@/components/collaboration/CollaboratePanel'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CollaboratePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: members } = await supabase
    .from('event_members')
    .select('*, profile:profiles(id, full_name, email, avatar_url)')
    .eq('event_id', id)

  const { data: inviteLinks } = await supabase
    .from('invite_links')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  const { data: activity } = await supabase
    .from('activity_log')
    .select('*, profile:profiles(full_name, avatar_url)')
    .eq('event_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

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

  return (
    <CollaboratePanel
      eventId={id}
      userId={user.id}
      members={members ?? []}
      inviteLinks={inviteLinks ?? []}
      initialActivity={activity ?? []}
      role={member?.role ?? 'viewer'}
      planTier={profile?.plan_tier ?? 'free'}
    />
  )
}
