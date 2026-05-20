'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateInitials, formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { PLAN_LIMITS } from '@/types'
import type { ActivityLog, EventMember, InviteLink } from '@/types'
import Link from 'next/link'

interface Props {
  eventId: string
  userId: string
  members: (EventMember & { profile: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null })[]
  inviteLinks: InviteLink[]
  initialActivity: (ActivityLog & { profile: { full_name: string | null; avatar_url: string | null; email: string | null } | null })[]
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
  const [membersList, setMembersList] = useState(members)
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const supabase = createClient()
  const isOwner = role === 'owner'
  const limits = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.free
  const nonOwnerMembers = members.filter((m) => m.role !== 'owner')
  const canCollaborate = limits.maxCollaborators === null || limits.maxCollaborators > 0
  const atCollaboratorLimit = limits.maxCollaborators !== null && nonOwnerMembers.length >= limits.maxCollaborators

  useEffect(() => {
    const channel = supabase
      .channel(`activity:${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'activity_log', filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        const { data: log } = await supabase
          .from('activity_log')
          .select('*, profile:profiles(full_name, avatar_url, email)')
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

  async function removeMember(memberId: string) {
    setRemoving(memberId)
    const { error } = await supabase.from('event_members').delete().eq('id', memberId)
    if (error) {
      toast.error('Eroare la eliminare')
    } else {
      setMembersList((prev) => prev.filter((m) => m.id !== memberId))
      toast.success('Colaborator eliminat')
    }
    setRemoving(null)
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
          <CardTitle className="text-base">Colaboratori ({membersList.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {membersList.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                  {generateInitials(m.profile?.full_name ?? m.profile?.email ?? '?')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.profile?.full_name ?? 'Utilizator'}</p>
                <p className="text-xs text-muted-foreground truncate">{m.profile?.email}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {m.role === 'owner' ? 'Proprietar' : m.role === 'editor' ? 'Editor' : 'Vizualizator'}
              </Badge>
              {isOwner && m.role !== 'owner' && (
                <button
                  onClick={() => removeMember(m.id)}
                  disabled={removing === m.id}
                  className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0"
                  title="Elimină colaborator"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}

          {isOwner && (
            <div className="pt-3 border-t space-y-3">
              {!canCollaborate ? (
                <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤝</span>
                    <p className="font-semibold text-gray-900 text-sm">Editați împreună în timp real</p>
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      'Partenerul vede fiecare modificare instant',
                      'Nașii și plannerul pot edita direct',
                      'Feed activitate — cine a schimbat ce',
                      'Colaboratori nelimitați',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-rose-500 font-bold shrink-0">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/upgrade?autostart=pro" className="block">
                    <Button size="sm" className="w-full bg-rose-600 hover:bg-rose-700 font-semibold">
                      Activează cu Pro — 109 RON
                    </Button>
                  </Link>
                  <p className="text-[11px] text-gray-400 text-center">O singură plată · Fără abonament</p>
                </div>
              ) : atCollaboratorLimit ? (
                <div className="text-sm text-center py-2">
                  <p className="text-muted-foreground mb-1">
                    Ai {nonOwnerMembers.length} din {limits.maxCollaborators} colaboratori.
                  </p>
                  <p className="text-muted-foreground mb-3 text-xs">Upgrade la Pro pentru colaboratori nelimitați.</p>
                  <Link href="/upgrade?autostart=pro">
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700">Upgrade la Pro</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Atribuțiile colaboratorului</p>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'editor' | 'viewer')}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{inviteRole === 'editor' ? 'Editor' : 'Vizualizator'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">
                          <div className="py-0.5">
                            <p className="font-medium text-sm">Editor</p>
                            <p className="text-xs text-muted-foreground">Poate adăuga, edita și șterge invitați și mese</p>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="py-0.5">
                            <p className="font-medium text-sm">Vizualizator</p>
                            <p className="text-xs text-muted-foreground">Poate vedea totul, dar nu poate modifica</p>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 leading-relaxed">
                      {inviteRole === 'editor'
                        ? '✓ Adaugă / editează / șterge invitați  ·  ✓ Modifică planul de mese  ·  ✓ Actualizează RSVP'
                        : '✓ Vede lista de invitați  ·  ✓ Vede planul de mese  ·  ✗ Nu poate modifica nimic'}
                    </div>
                  </div>
                  <Button onClick={generateInviteLink} className="w-full bg-rose-600 hover:bg-rose-700">
                    Generează link de invitație
                  </Button>
                  {generatedLink && (
                    <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-muted-foreground truncate flex-1">{generatedLink}</p>
                      <Button size="sm" variant="ghost" onClick={() => copyLink(generatedLink)} className="shrink-0 h-6 text-xs">
                        {copied ? '✓' : 'Copiează'}
                      </Button>
                    </div>
                  )}
                  {limits.maxCollaborators !== null && (
                    <p className="text-xs text-muted-foreground text-center">
                      {nonOwnerMembers.length} din {limits.maxCollaborators} colaboratori folosiți
                    </p>
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
            {!limits.activityFeed && <Badge variant="outline" className="text-xs">Basic+</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!limits.activityFeed ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm font-medium mb-1">Funcție Basic & Pro</p>
              <p className="text-xs mb-3">Urmărește fiecare modificare în timp real.</p>
              <Link href="/upgrade">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700">Vezi planuri</Button>
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
                        {generateInitials(log.profile?.full_name ?? log.profile?.email ?? '?')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{log.profile?.full_name ?? log.profile?.email ?? 'Cineva'}</span>
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
