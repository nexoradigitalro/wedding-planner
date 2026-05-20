'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PLAN_LIMITS } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props {
  planTier: string
  eventCount: number
}

export default function CreateEventDialog({ planTier, eventCount }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)
  const venueRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const limits = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.free
  const atLimit = limits.maxEvents !== null && eventCount >= limits.maxEvents

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = nameRef.current?.value?.trim() ?? ''
    if (!name) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    }, { onConflict: 'id', ignoreDuplicates: true })

    const date = (day && month && year && year.length === 4)
      ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      : null
    const venue = venueRef.current?.value?.trim() || null

    const { data: event, error } = await supabase
      .from('events')
      .insert({ name, date, venue, owner_id: user.id })
      .select()
      .single()

    if (error) {
      toast.error('Eroare: ' + error.message)
      setLoading(false)
      return
    }

    if (event) {
      await supabase.from('event_members').insert({
        event_id: event.id,
        user_id: user.id,
        role: 'owner',
      })
      toast.success('Eveniment creat!')
      setOpen(false)
      router.push(`/events/${event.id}/guests`)
      router.refresh()
    }
    setLoading(false)
  }

  if (atLimit) {
    return (
      <Link href="/upgrade">
        <Button className="bg-rose-600 hover:bg-rose-700">Upgrade pentru mai multe evenimente</Button>
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
            <input
              ref={nameRef}
              id="event-name"
              placeholder="Nunta Ana & Mihai"
              required
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <Label>Data nunții</Label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="ZZ"
                min={1} max={31}
                value={day}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                  setDay(v)
                  if (v.length === 2) monthRef.current?.focus()
                }}
                className="h-10 w-16 rounded-lg border border-stone-200 bg-white px-3 text-sm text-center outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
              />
              <span className="text-gray-400 font-medium">/</span>
              <input
                ref={monthRef}
                type="number"
                placeholder="LL"
                min={1} max={12}
                value={month}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                  setMonth(v)
                  if (v.length === 2) yearRef.current?.focus()
                }}
                className="h-10 w-16 rounded-lg border border-stone-200 bg-white px-3 text-sm text-center outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
              />
              <span className="text-gray-400 font-medium">/</span>
              <input
                ref={yearRef}
                type="number"
                placeholder="AAAA"
                min={2024} max={2100}
                value={year}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setYear(v)
                }}
                className="h-10 w-24 rounded-lg border border-stone-200 bg-white px-3 text-sm text-center outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="event-venue">Locație / Salon</Label>
            <input
              ref={venueRef}
              id="event-venue"
              placeholder="Palatul Noblesse, București"
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
            />
          </div>
          <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={loading}>
            {loading ? 'Se creează...' : 'Creează evenimentul'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
