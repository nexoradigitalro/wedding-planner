'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { categoryLabel, rsvpLabel, cn } from '@/lib/utils'
import type { Guest } from '@/types'
import Papa from 'papaparse'

interface Props {
  eventId: string
  initialGuests: Guest[]
  tables: { id: string; name: string; capacity: number }[]
  canEdit: boolean
  planTier: string
}

const RSVP_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
}

const CATEGORY_COLORS: Record<string, string> = {
  family: 'bg-purple-100 text-purple-800',
  friends: 'bg-blue-100 text-blue-800',
  coworkers: 'bg-orange-100 text-orange-800',
  kids: 'bg-pink-100 text-pink-800',
}

const emptyGuest: {
  name: string; email: string; phone: string; category: Guest['category'];
  rsvp_status: Guest['rsvp_status']; has_plus_one: boolean; plus_one_name: string;
  dietary: string; notes: string;
} = {
  name: '', email: '', phone: '', category: 'friends',
  rsvp_status: 'pending', has_plus_one: false, plus_one_name: '',
  dietary: '', notes: '',
}

export default function GuestList({ eventId, initialGuests, tables, canEdit, planTier }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterRsvp, setFilterRsvp] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)
  const [form, setForm] = useState(emptyGuest)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`guests:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setGuests((prev) => [...prev, payload.new as Guest].sort((a, b) => a.name.localeCompare(b.name)))
          if (payload.eventType === 'UPDATE') setGuests((prev) => prev.map((g) => g.id === (payload.new as Guest).id ? payload.new as Guest : g))
          if (payload.eventType === 'DELETE') setGuests((prev) => prev.filter((g) => g.id !== payload.old.id))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, supabase])

  const filtered = guests.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || g.category === filterCategory
    const matchRsvp = filterRsvp === 'all' || g.rsvp_status === filterRsvp
    return matchSearch && matchCat && matchRsvp
  })

  const confirmed = guests.filter((g) => g.rsvp_status === 'confirmed').length
  const declined = guests.filter((g) => g.rsvp_status === 'declined').length
  const pending = guests.filter((g) => g.rsvp_status === 'pending').length

  function openAdd() {
    setEditing(null)
    setForm(emptyGuest)
    setOpen(true)
  }

  function openEdit(guest: Guest) {
    setEditing(guest)
    setForm({
      name: guest.name, email: guest.email ?? '', phone: guest.phone ?? '',
      category: guest.category, rsvp_status: guest.rsvp_status,
      has_plus_one: guest.has_plus_one, plus_one_name: guest.plus_one_name ?? '',
      dietary: guest.dietary ?? '', notes: guest.notes ?? '',
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      name: form.name, email: form.email || null, phone: form.phone || null,
      category: form.category, rsvp_status: form.rsvp_status,
      has_plus_one: form.has_plus_one, plus_one_name: form.plus_one_name || null,
      dietary: form.dietary || null, notes: form.notes || null,
    }
    if (editing) {
      await supabase.from('guests').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('guests').insert({ ...payload, event_id: eventId })
    }
    setOpen(false)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('guests').delete().eq('id', id)
  }

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[]
        const toInsert = rows.map((row) => ({
          event_id: eventId,
          name: row.name || row.Name || row.Nume || '',
          email: row.email || row.Email || null,
          phone: row.phone || row.Phone || row.Telefon || null,
          category: (['family', 'friends', 'coworkers', 'kids'].includes(row.category) ? row.category : 'friends') as Guest['category'],
          rsvp_status: 'pending' as const,
          has_plus_one: false,
        })).filter((r) => r.name)
        if (toInsert.length > 0) {
          await supabase.from('guests').insert(toInsert)
        }
      },
    })
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: guests.length, color: 'text-gray-700' },
          { label: 'Confirmați', value: confirmed, color: 'text-green-600' },
          { label: 'În așteptare', value: pending, color: 'text-yellow-600' },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Caută după nume sau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? 'all')}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="family">Familie</SelectItem>
            <SelectItem value="friends">Prieteni</SelectItem>
            <SelectItem value="coworkers">Colegi</SelectItem>
            <SelectItem value="kids">Copii</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRsvp} onValueChange={(v) => setFilterRsvp(v ?? 'all')}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="RSVP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            <SelectItem value="pending">În așteptare</SelectItem>
            <SelectItem value="confirmed">Confirmat</SelectItem>
            <SelectItem value="declined">Refuzat</SelectItem>
          </SelectContent>
        </Select>
        {canEdit && (
          <div className="flex gap-2 sm:ml-auto">
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleCsvImport} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              📥 Import CSV
            </Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={openAdd}>
              + Invitat
            </Button>
          </div>
        )}
      </div>

      {/* Guest table */}
      <div className="rounded-lg border overflow-hidden bg-white">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {guests.length === 0 ? (
              <div className="space-y-2">
                <div className="text-4xl">👥</div>
                <p className="font-medium">Niciun invitat încă</p>
                <p className="text-sm">Adaugă invitați manual sau importă din CSV/Excel.</p>
              </div>
            ) : (
              <p>Niciun rezultat pentru filtrele selectate.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nume</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Categorie</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">RSVP</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Masă</th>
                  {canEdit && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{guest.name}</p>
                      {guest.email && <p className="text-xs text-muted-foreground">{guest.email}</p>}
                      {guest.has_plus_one && (
                        <p className="text-xs text-muted-foreground">+1 {guest.plus_one_name ?? ''}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge className={cn('text-xs border-0', CATEGORY_COLORS[guest.category])}>
                        {categoryLabel(guest.category)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs border-0', RSVP_COLORS[guest.rsvp_status])}>
                        {rsvpLabel(guest.rsvp_status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {(guest.table as { name: string } | null)?.name ?? '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>✏️</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(guest.id)} className="text-destructive hover:text-destructive">🗑</Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editează invitat' : 'Invitat nou'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Nume *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ion Popescu" required />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ion@exemplu.ro" />
              </div>
              <div className="space-y-1">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07xx xxx xxx" />
              </div>
              <div className="space-y-1">
                <Label>Categorie</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v as Guest['category'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Familie</SelectItem>
                    <SelectItem value="friends">Prieteni</SelectItem>
                    <SelectItem value="coworkers">Colegi</SelectItem>
                    <SelectItem value="kids">Copii</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status RSVP</Label>
                <Select value={form.rsvp_status} onValueChange={(v) => v && setForm({ ...form, rsvp_status: v as Guest['rsvp_status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">În așteptare</SelectItem>
                    <SelectItem value="confirmed">Confirmat</SelectItem>
                    <SelectItem value="declined">Refuzat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="plus_one"
                  checked={form.has_plus_one}
                  onChange={(e) => setForm({ ...form, has_plus_one: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="plus_one">Are +1 însoțitor</Label>
              </div>
              {form.has_plus_one && (
                <div className="col-span-2 space-y-1">
                  <Label>Numele însoțitorului</Label>
                  <Input value={form.plus_one_name} onChange={(e) => setForm({ ...form, plus_one_name: e.target.value })} placeholder="Maria Popescu" />
                </div>
              )}
              <div className="space-y-1">
                <Label>Preferințe alimentare</Label>
                <Input value={form.dietary} onChange={(e) => setForm({ ...form, dietary: e.target.value })} placeholder="Vegetarian, alergii..." />
              </div>
              <div className="space-y-1">
                <Label>Notițe</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Orice detaliu util" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={loading || !form.name}>
              {loading ? 'Se salvează...' : editing ? 'Salvează' : 'Adaugă invitat'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
