'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateInitials, formatRelativeTime } from '@/lib/utils'
import type { ActivityLog, EventMember, InviteLink } from '@/types'
import Link from 'next/link'

interface Props {
  eventId: string
  userId: string
  members: (EventMember & { profile: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null })[]
  inviteLinks: InviteLink[]
  initialActivity: (ActivityLog & { profile: { full_name: string | null; avatar_url: string | null } | null })[]
  role: string
  planTier: string
}

const ACTION_LABELS: Record<string, (p: Record<string, unknown>) => string> = {
  guest_added: (p) => `a adăugat invitatul ${p.guest_name}`,
  guest_removed: (p) => `a șters invitatul ${p.guest_name}`,
  guest_moved: (p) => `a mutat ${p.guest_name} la ${p.to_table ?? 'neasignat'}`,
  guest_updated: (p) => `a editat invitatul ${p.guest_name}`,
  table_added: (p) => `a creat masa ${p.table_name}`,
  table_removed: (p) => `a șters masa ${p.table_name}`,
  rsvp_updated: (p) => `a actualizat RSVP pentru ${p.guest_name}`,
  collaborator_invited: (p) => `a invitat un colaborator (${p.role})`,
}

export default function CollaboratePanel({ eventId, userId, members, inviteLinks, initialActivity, role, planTier }: Props) {
  const [activity, setActivity] = useState(initialActivity)
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const isOwner = role === 'owner'
  const isPro = planTier === 'pro'

  useEffect(() => {
    const channel = supabase
      .channel(`activity:${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'activity_log', filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        const { data: log } = await supabase
          .from('activity_log')
          .select('*, profile:profiles(full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        if (log) setActivity((prev) => [log, ...prev].slice(0, 50))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, supabase])

  async function generateInviteLink() {
    const { data } = await supabase
      .from('invite_links')
      .insert({ event_id: eventId, role: inviteRole, created_by: userId })
      .select()
      .single()
    if (data) {
      const url = `${window.location.origin}/join/${data.token}`
      setGeneratedLink(url)
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Colaboratori ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                  {m.profile?.full_name ? generateInitials(m.profile.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.profile?.full_name ?? 'Utilizator'}</p>
                <p className="text-xs text-muted-foreground truncate">{m.profile?.email}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {m.role === 'owner' ? 'Proprietar' : m.role === 'editor' ? 'Editor' : 'Vizualizator'}
              </Badge>
            </div>
          ))}

          {isOwner && (
            <div className="pt-3 border-t space-y-3">
              {!isPro ? (
                <div className="text-sm text-center py-2">
                  <p className="text-muted-foreground mb-2">Colaborare nelimitată necesită planul Pro.</p>
                  <Link href="/upgrade">
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700">Upgrade la Pro</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'editor' | 'viewer')}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor (poate modifica)</SelectItem>
                        <SelectItem value="viewer">Vizualizator (doar citire)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={generateInviteLink} className="bg-rose-600 hover:bg-rose-700 shrink-0">
                      Generează link
                    </Button>
                  </div>
                  {generatedLink && (
                    <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-muted-foreground truncate flex-1">{generatedLink}</p>
                      <Button size="sm" variant="ghost" onClick={() => copyLink(generatedLink)} className="shrink-0 h-6 text-xs">
                        {copied ? '✓' : 'Copiază'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Feed activitate
            {!isPro && <Badge variant="outline" className="text-xs">Pro</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isPro ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm font-medium mb-1">Funcție Pro</p>
              <p className="text-xs mb-3">Urmărește fiecare modificare în timp real.</p>
              <Link href="/upgrade">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700">Upgrade la Pro</Button>
              </Link>
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nicio activitate încă.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activity.map((log) => {
                const label = ACTION_LABELS[log.action]?.(log.payload) ?? log.action
                return (
                  <div key={log.id} className="flex gap-2 text-sm">
                    <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                      <AvatarImage src={log.profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-rose-100 text-rose-700">
                        {log.profile?.full_name ? generateInitials(log.profile.full_name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{log.profile?.full_name ?? 'Cineva'}</span>
                      {' '}{label}
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(log.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
