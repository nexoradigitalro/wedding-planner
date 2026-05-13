'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PLAN_LIMITS } from '@/types'
import Link from 'next/link'

interface Props {
  planTier: string
  eventCount: number
}

export default function CreateEventDialog({ planTier, eventCount }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const limits = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.free
  const atLimit = limits.maxEvents !== null && eventCount >= limits.maxEvents

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: event, error } = await supabase
      .from('events')
      .insert({ name, date: date || null, venue: venue || null, owner_id: user.id })
      .select()
      .single()

    if (!error && event) {
      await supabase.from('event_members').insert({
        event_id: event.id,
        user_id: user.id,
        role: 'owner',
      })
      setOpen(false)
      router.push(`/events/${event.id}/guests`)
      router.refresh()
    }
    setLoading(false)
  }

  if (atLimit) {
    return (
      <Link href="/upgrade">
        <Button className="bg-rose-600 hover:bg-rose-700">
          ⬆ Upgrade pentru mai multe evenimente
        </Button>
      </Link>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-rose-600 hover:bg-rose-700" />}>
        + Eveniment nou
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eveniment nou</DialogTitle>
          <DialogDescription>Completează câteva detalii de bază. Le poți modifica oricând.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="event-name">Numele evenimentului *</Label>
            <Input
              id="event-name"
              placeholder="Nunta Ana & Mihai"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="event-date">Data nunții</Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="event-venue">Locație / Salon</Label>
            <Input
              id="event-venue"
              placeholder="Palatul Noblesse, București"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={loading || !name}>
            {loading ? 'Se creează...' : 'Creează evenimentul'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
