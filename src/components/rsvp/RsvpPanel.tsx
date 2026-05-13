'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RsvpResponse } from '@/types'

interface Props {
  eventId: string
  responses: RsvpResponse[]
}

export default function RsvpPanel({ eventId, responses: initial }: Props) {
  const [responses, setResponses] = useState(initial)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const rsvpUrl = typeof window !== 'undefined' ? `${window.location.origin}/rsvp/${eventId}` : ''

  useEffect(() => {
    const channel = supabase
      .channel(`rsvp:${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rsvp_responses', filter: `event_id=eq.${eventId}` },
        (payload) => setResponses((prev) => [payload.new as RsvpResponse, ...prev])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, supabase])

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
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">+1</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Meniu / Alergii</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Mesaj</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {responses.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.guest_name}</td>
                    <td className="px-4 py-3">
                      <Badge className={r.attending ? 'bg-green-100 text-green-800 border-0' : 'bg-red-100 text-red-800 border-0'}>
                        {r.attending ? 'Vine' : 'Nu vine'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {r.plus_one_count > 0 ? `+${r.plus_one_count}` : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {[r.menu_choice, r.allergies].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs max-w-xs truncate">
                      {r.message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
