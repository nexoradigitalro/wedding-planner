import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { InviteLink } from '@/types'

interface Props {
  params: Promise<{ token: string }>
}

export default async function JoinPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/join/${token}`)
  }

  const admin = createAdminClient()

  const { data: inviteRaw } = await admin
    .from('invite_links')
    .select('*')
    .eq('token', token)
    .single()

  const invite = inviteRaw as InviteLink | null

  if (!invite) redirect('/dashboard')
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) redirect('/dashboard?error=link_expired')
  if (invite.max_uses && invite.uses >= invite.max_uses) redirect('/dashboard?error=link_used')

  const { data: existing } = await admin
    .from('event_members')
    .select('id')
    .eq('event_id', invite.event_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    await admin.from('event_members').insert({
      event_id: invite.event_id,
      user_id: user.id,
      role: invite.role,
    })
    await admin.from('invite_links').update({ uses: invite.uses + 1 }).eq('id', invite.id)
    await admin.from('activity_log').insert({
      event_id: invite.event_id,
      user_id: user.id,
      action: 'collaborator_invited',
      payload: { role: invite.role },
    })
  }

  redirect(`/events/${invite.event_id}/guests`)
}
