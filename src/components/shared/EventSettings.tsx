'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Event } from '@/types'

interface Props {
  event: Event | null
}

function parseDateParts(iso: string | null): { day: string; month: string; year: string } {
  if (!iso) return { day: '', month: '', year: '' }
  const [y, m, d] = iso.split('-')
  return { day: d ?? '', month: m ?? '', year: y ?? '' }
}

export default function EventSettings({ event }: Props) {
  const initial = parseDateParts(event?.date ?? null)
  const [name, setName] = useState(event?.name ?? '')
  const [day, setDay] = useState(initial.day)
  const [month, setMonth] = useState(initial.month)
  const [year, setYear] = useState(initial.year)
  const [venue, setVenue] = useState(event?.venue ?? '')
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return
    setLoading(true)
    const date = (day && month && year && year.length === 4)
      ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      : null
    const { error } = await supabase
      .from('events')
      .update({ name: name.trim(), date, venue: venue.trim() || null })
      .eq('id', event.id)
    if (error) {
      toast.error('Eroare: ' + error.message)
    } else {
      toast.success('Eveniment actualizat')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!event) return
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
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nunta Ana & Mihai" />
            </div>
            <div className="space-y-1">
              <Label>Data nunții</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number" placeholder="ZZ" min={1} max={31} value={day}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setDay(v); if (v.length === 2) monthRef.current?.focus() }}
                  className="h-10 w-16 rounded-lg border border-stone-200 bg-white px-3 text-sm text-center outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
                />
                <span className="text-gray-400 font-medium">/</span>
                <input
                  ref={monthRef} type="number" placeholder="LL" min={1} max={12} value={month}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setMonth(v); if (v.length === 2) yearRef.current?.focus() }}
                  className="h-10 w-16 rounded-lg border border-stone-200 bg-white px-3 text-sm text-center outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
                />
                <span className="text-gray-400 font-medium">/</span>
                <input
                  ref={yearRef} type="number" placeholder="AAAA" min={2024} max={2100} value={year}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setYear(v) }}
                  className="h-10 w-24 rounded-lg border border-stone-200 bg-white px-3 text-sm text-center outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Locație / Salon</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Palatul Noblesse, București" />
            </div>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700" disabled={loading || !name}>
              {loading ? 'Se salvează...' : 'Salvează modificările'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-red-600">Zonă periculoasă</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!deleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Șterge evenimentul</p>
                <p className="text-xs text-muted-foreground mt-0.5">Acțiunea este ireversibilă. Toți invitații și mesele vor fi șterse.</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50 shrink-0" onClick={() => setDeleteConfirm(true)}>
                Șterge
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-700 font-medium">Ești sigur? Operația nu poate fi anulată.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>Anulează</Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Da, șterge</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
