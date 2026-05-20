'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { RsvpResponse } from '@/types'

interface Props {
  eventId: string
  responses: RsvpResponse[]
}

export default function RsvpPanel({ eventId, responses: initial }: Props) {
  const [responses, setResponses] = useState(initial)
  const [copied, setCopied] = useState(false)
  const [imported, setImported] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState<string | null>(null)
  const [rsvpUrl, setRsvpUrl] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setRsvpUrl(`${window.location.origin}/rsvp/${eventId}`)
  }, [eventId])

  // Restore imported state from localStorage so it persists across navigations
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`rsvp_imported_${eventId}`)
      if (stored) setImported(new Set(JSON.parse(stored)))
    } catch {}
  }, [eventId])

  useEffect(() => {
    const channel = supabase
      .channel(`rsvp:${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rsvp_responses', filter: `event_id=eq.${eventId}` },
        (payload) => setResponses((prev) => [payload.new as RsvpResponse, ...prev])
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rsvp_responses', filter: `event_id=eq.${eventId}` },
        (payload) => setResponses((prev) => prev.filter((r) => r.id !== payload.old.id))
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, supabase])

  async function handleAddGuest(r: RsvpResponse) {
    setImporting(r.id)
    const dietary = [r.menu_choice, r.allergies].filter(Boolean).join(' · ') || null

    const { error } = await supabase.from('guests').insert({
      event_id: eventId,
      name: r.guest_name,
      rsvp_status: r.attending ? 'confirmed' : 'declined',
      has_plus_one: !!r.companion_name,
      plus_one_name: r.companion_name || null,
      plus_one_confirmed: !!r.companion_name,
      dietary,
      notes: r.message || null,
      category: 'friends',
    })

    setImporting(null)
    if (error) {
      toast.error('Eroare la adăugare')
    } else {
      const next = new Set([...imported, r.id])
      setImported(next)
      try { localStorage.setItem(`rsvp_imported_${eventId}`, JSON.stringify([...next])) } catch {}
      toast.success(r.companion_name
        ? `${r.guest_name} +1 ${r.companion_name} adăugați`
        : `${r.guest_name} adăugat la invitați`)
    }
  }

  async function handleDeleteResponse(r: RsvpResponse) {
    setResponses((prev) => prev.filter((x) => x.id !== r.id))
    const { error } = await supabase.from('rsvp_responses').delete().eq('id', r.id)
    if (error) {
      setResponses((prev) => [r, ...prev])
      toast.error('Eroare la ștergere')
    } else {
      toast.success(`Răspuns ${r.guest_name} șters`)
    }
  }

  function copy() {
    navigator.clipboard.writeText(rsvpUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const attending = responses.filter((r) => r.attending)
  const declined = responses.filter((r) => !r.attending)
  const totalGuests = attending.reduce((sum, r) => sum + 1 + r.plus_one_count, 0)

  return (
    <div className="space-y-6">
      {/* Link sharing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Link public RSVP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Trimite acest link invitaților. Nu necesită cont.
          </p>
          <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground truncate flex-1">{rsvpUrl}</p>
            <Button size="sm" onClick={copy} variant="outline" className="shrink-0">
              {copied ? '✓ Copiat' : 'Copiază'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Răspunsuri', value: responses.length, color: 'text-gray-700' },
          { label: 'Confirmați', value: attending.length, color: 'text-green-600' },
          { label: 'Total invitați', value: totalGuests, color: 'text-blue-600' },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Responses list */}
      <div className="rounded-lg border overflow-hidden bg-white">
        {responses.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <div className="text-4xl mb-2">📩</div>
            <p className="font-medium">Niciun răspuns încă</p>
            <p className="text-sm">Răspunsurile apar automat în timp real.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nume</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Însoțitor</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Meniu / Alergii</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Mesaj</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {responses.map((r) => {
                  const isImported = imported.has(r.id)
                  const isImporting = importing === r.id
                  return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.guest_name}</td>
                    <td className="px-4 py-3">
                      <Badge className={r.attending ? 'bg-green-100 text-green-800 border-0' : 'bg-red-100 text-red-800 border-0'}>
                        {r.attending ? 'Vine' : 'Nu vine'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {r.companion_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {[r.menu_choice, r.allergies].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs max-w-xs truncate">
                      {r.message || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isImported ? (
                          <span className="text-xs text-green-600 font-medium">✓ Adăugat</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50 h-7 px-2.5"
                            onClick={() => handleAddGuest(r)}
                            disabled={isImporting}
                          >
                            {isImporting ? '...' : '+ Invitat'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResponse(r)}
                          className="text-gray-300 hover:text-red-500 h-7 w-7 p-0"
                          title="Șterge răspuns"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
