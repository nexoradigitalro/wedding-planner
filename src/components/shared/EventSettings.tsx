'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Event } from '@/types'

interface Props {
  event: Event | null
}

export default function EventSettings({ event }: Props) {
  const [name, setName] = useState(event?.name ?? '')
  const [date, setDate] = useState(event?.date ?? '')
  const [venue, setVenue] = useState(event?.venue ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return
    setLoading(true)
    await supabase.from('events').update({ name, date: date || null, venue: venue || null }).eq('id', event.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
    setLoading(false)
  }

  async function handleDelete() {
    if (!event) return
    if (!confirm('Ești sigur? Aceasta va șterge evenimentul și toți invitații permanent.')) return
    await supabase.from('events').delete().eq('id', event.id)
    router.push('/dashboard')
  }

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader><CardTitle>Detalii eveniment</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label>Numele evenimentului *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Data nunții</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Locație / Salon</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Palatul Noblesse, București" />
            </div>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700" disabled={loading || !name}>
              {saved ? '✓ Salvat' : loading ? 'Se salvează...' : 'Salvează'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-red-600">Zonă periculoasă</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ștergerea evenimentului este permanentă și nu poate fi anulată.
            Toți invitații, mesele și activitatea vor fi șterse.
          </p>
          <Button variant="destructive" onClick={handleDelete}>Șterge evenimentul</Button>
        </CardContent>
      </Card>
    </div>
  )
}
