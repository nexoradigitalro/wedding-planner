'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { categoryLabel, rsvpLabel, cn } from '@/lib/utils'
import { PLAN_LIMITS } from '@/types'
import type { Guest } from '@/types'
import Papa from 'papaparse'
import Link from 'next/link'
import { toast } from 'sonner'

interface Props {
  eventId: string
  userId: string
  initialGuests: Guest[]
  tables: { id: string; name: string; capacity: number }[]
  canEdit: boolean
  planTier: string
}

const CATEGORY_LABELS: Record<string, string> = {
  family: 'Familie', friends: 'Prieteni', coworkers: 'Colegi', kids: 'Copii',
}
const RSVP_LABELS: Record<string, string> = {
  pending: 'În așteptare', confirmed: 'Confirmat', declined: 'Refuzat',
}
function pdfSafe(text: string): string {
  return text
    .replace(/[ăâ]/g, 'a').replace(/[ĂÂ]/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/[șş]/g, 's').replace(/[ȘŞ]/g, 'S')
    .replace(/[țţ]/g, 't').replace(/[ȚŢ]/g, 'T')
}

const PORTION_LABELS: Record<string, string> = {
  full: 'Porție întreagă (adult)', half: 'Porție copil (½)', none: 'Copil fără meniu',
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

const emptyGuest = {
  name: '', email: '', phone: '', category: 'friends' as Guest['category'],
  rsvp_status: 'pending' as Guest['rsvp_status'], has_plus_one: false, plus_one_name: '',
  plus_one_portion: 'full' as 'full' | 'half' | 'none',
  dietary: '', notes: '',
}

export default function GuestList({ eventId, userId, initialGuests, tables, canEdit, planTier }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterRsvp, setFilterRsvp] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)
  const [form, setForm] = useState(emptyGuest)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const plusOneNameRef = useRef<HTMLInputElement>(null)
  const dietaryRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const limits = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.free
  const atGuestLimit = limits.maxGuests !== null && guests.length >= limits.maxGuests
  const nearGuestLimit = !atGuestLimit && limits.maxGuests !== null && guests.length >= Math.floor(limits.maxGuests * 0.8)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`guests:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setGuests((prev) => prev.some((g) => g.id === (payload.new as Guest).id) ? prev : [...prev, payload.new as Guest].sort((a, b) => a.name.localeCompare(b.name)))
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

  const plusOneCount = guests.filter((g) => g.has_plus_one).length
  const total = guests.length + plusOneCount
  const confirmed = guests.filter((g) => g.rsvp_status === 'confirmed').length
  const declined = guests.filter((g) => g.rsvp_status === 'declined').length
  const pending = guests.filter((g) => g.rsvp_status === 'pending').length

  const fullPortions = guests.length
    + guests.filter((g) => g.has_plus_one && g.plus_one_portion === 'full').length
  const halfPortions = guests.filter((g) => g.has_plus_one && g.plus_one_portion === 'half').length
  const noPortions = guests.filter((g) => g.has_plus_one && g.plus_one_portion === 'none').length

  // Mărturii = 1 per invitație (cuplu sau single), excl. declinați
  const marturii = guests.filter((g) => g.rsvp_status !== 'declined').length

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
      plus_one_portion: guest.plus_one_portion ?? 'full',
      dietary: guest.dietary ?? '', notes: guest.notes ?? '',
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const name = nameRef.current?.value?.trim() || form.name
    const payload = {
      name, email: emailRef.current?.value || null, phone: phoneRef.current?.value || null,
      category: form.category, rsvp_status: form.rsvp_status,
      has_plus_one: form.has_plus_one,
      plus_one_name: form.has_plus_one ? (plusOneNameRef.current?.value || null) : null,
      plus_one_portion: form.has_plus_one ? form.plus_one_portion : 'full',
      dietary: dietaryRef.current?.value || null, notes: notesRef.current?.value || null,
    }
    if (!payload.name) { toast.error('Numele este obligatoriu'); setLoading(false); return }
    if (editing) {
      const { error } = await supabase.from('guests').update(payload).eq('id', editing.id)
      if (error) { toast.error('Eroare: ' + error.message); setLoading(false); return }
      setGuests((prev) => prev.map((g) => g.id === editing.id ? { ...g, ...payload } : g))
      await supabase.from('activity_log').insert({ event_id: eventId, user_id: userId, action: 'guest_updated', payload: { guest_name: form.name } })
      toast.success('Invitat actualizat')
    } else {
      const { data: newGuest, error } = await supabase.from('guests').insert({ ...payload, event_id: eventId }).select('*, table:tables(id, name)').single()
      if (error) { toast.error('Eroare: ' + error.message); setLoading(false); return }
      if (newGuest) setGuests((prev) => [...prev, newGuest as Guest].sort((a, b) => a.name.localeCompare(b.name)))
      await supabase.from('activity_log').insert({ event_id: eventId, user_id: userId, action: 'guest_added', payload: { guest_name: form.name } })
      toast.success('Invitat adăugat')
    }
    setOpen(false)
    setLoading(false)
  }

  async function handleDelete(guest: Guest) {
    setGuests((prev) => prev.filter((g) => g.id !== guest.id))
    await supabase.from('guests').delete().eq('id', guest.id)
    await supabase.from('rsvp_responses')
      .delete()
      .eq('event_id', eventId)
      .eq('guest_name', guest.name)
    await supabase.from('activity_log').insert({
      event_id: eventId, user_id: userId,
      action: 'guest_removed', payload: { guest_name: guest.name },
    })
    toast.success(`${guest.name} șters`)
  }

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[]
        const toInsert = rows.map((row) => {
          const name = row.name || row.Name || row.Nume || ''
          if (!name) return null

          // RSVP
          const rsvpRaw = (row.RSVP || row.rsvp || '').toLowerCase()
          const rsvp_status: Guest['rsvp_status'] =
            rsvpRaw.includes('confirmat') || rsvpRaw === 'confirmed' ? 'confirmed'
            : rsvpRaw.includes('refuzat') || rsvpRaw === 'declined' ? 'declined'
            : 'pending'

          // Companion
          const companion = (row.Insotitor || row.insotitor || row.companion || '').trim()
          const has_plus_one = !!companion && companion.toLowerCase() !== 'nu' && companion !== '-'

          // Companion portion
          const portionRaw = (row['Portie insotitor'] || row['Portie Insotitor'] || '').toLowerCase()
          const plus_one_portion: 'full' | 'half' | 'none' =
            portionRaw.includes('meniu') ? 'none'
            : portionRaw.includes('½') || portionRaw.includes('copil') ? 'half'
            : 'full'

          return {
            event_id: eventId,
            name,
            email: row.email || row.Email || null,
            phone: row.phone || row.Phone || row.Telefon || null,
            category: (['family', 'friends', 'coworkers', 'kids'].includes(row.category) ? row.category : 'friends') as Guest['category'],
            rsvp_status,
            has_plus_one,
            plus_one_name: has_plus_one ? companion : null,
            plus_one_portion: has_plus_one ? plus_one_portion : 'full',
          }
        }).filter((r): r is NonNullable<typeof r> => r !== null)
        if (toInsert.length > 0) {
          await supabase.from('guests').insert(toInsert)
          toast.success(`${toInsert.length} invitați importați`)
        }
      },
    })
    e.target.value = ''
  }

  async function handleDownloadTemplate() {
    const XLSX = await import('xlsx')
    const template = [
      { Nume: 'Ion Popescu', RSVP: 'Confirmat', Insotitor: 'Maria Popescu', 'Portie insotitor': 'Porție întreagă (adult)' },
      { Nume: 'Ana Constantin', RSVP: 'În așteptare', Insotitor: 'Nu', 'Portie insotitor': '' },
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invitați')
    XLSX.writeFile(wb, 'template-invitati.xlsx')
  }

  function handleCsvExport() {
    const rows = guests.map((g) => ({
      Nume: g.name,
      RSVP: RSVP_LABELS[g.rsvp_status] ?? g.rsvp_status,
      Insotitor: g.has_plus_one ? (g.plus_one_name ?? 'Da') : 'Nu',
      'Portie insotitor': g.has_plus_one ? (PORTION_LABELS[g.plus_one_portion] ?? g.plus_one_portion) : '',
      Masa: tables.find((t) => t.id === g.table_id)?.name ?? '',
      'Preferinta mancare': g.dietary ?? '',
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invitati.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${guests.length} invitați exportați`)
  }

  async function handlePdfExport() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(pdfSafe('Plan de mese — invitati'), 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(pdfSafe(`Total: ${guests.length} · Confirmati: ${confirmed} · In asteptare: ${pending} · Refuzati: ${declined}`), 14, 28)
    doc.setTextColor(0)

    // Seating plan grouped by table
    const byTable: Record<string, { name: string; rows: string[][] }> = {}
    const unassignedRows: string[][] = []

    for (const g of [...guests].sort((a, b) => a.name.localeCompare(b.name))) {
      const tableInfo = g.table_id ? tables.find((t) => t.id === g.table_id) : null
      const row = [
        pdfSafe(g.name),
        pdfSafe(rsvpLabel(g.rsvp_status)),
        pdfSafe(categoryLabel(g.category)),
        pdfSafe(g.dietary || '—'),
        g.has_plus_one ? pdfSafe(`Da${g.plus_one_name ? ` (${g.plus_one_name})` : ''}`) : 'Nu',
      ]
      if (tableInfo) {
        if (!byTable[tableInfo.id]) byTable[tableInfo.id] = { name: tableInfo.name, rows: [] }
        byTable[tableInfo.id].rows.push(row)
      } else {
        unassignedRows.push(row)
      }
    }

    const head = [['Invitat', 'RSVP', 'Categorie', 'Preferinte alimentare', '+1']]

    let startY = 35
    for (const { name, rows } of Object.values(byTable)) {
      doc.setFontSize(11)
      doc.setTextColor(0)
      // @ts-expect-error autoTable augments doc
      const prevFinalY: number = doc.lastAutoTable?.finalY ?? startY
      if (prevFinalY > 250) { doc.addPage(); startY = 14 }
      doc.text(pdfSafe(name), 14, prevFinalY + 8)
      autoTable(doc, {
        head,
        body: rows,
        startY: prevFinalY + 12,
        headStyles: { fillColor: [225, 29, 72] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      })
    }

    if (unassignedRows.length > 0) {
      // @ts-expect-error autoTable augments doc
      const prevFinalY: number = doc.lastAutoTable?.finalY ?? startY
      doc.setFontSize(11)
      doc.text('Neasignati', 14, prevFinalY + 8)
      autoTable(doc, {
        head,
        body: unassignedRows,
        startY: prevFinalY + 12,
        headStyles: { fillColor: [107, 114, 128] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      })
    }

    doc.save('plan-mese.pdf')
    toast.success('PDF exportat')
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total persoane', value: total, color: 'text-gray-700' },
          { label: 'Confirmați', value: confirmed, color: 'text-green-600' },
          { label: 'În așteptare', value: pending, color: 'text-yellow-600' },
          { label: 'Refuzați', value: declined, color: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Porții + Mărturii */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-sm">🍽</div>
          <div>
            <p className="text-xl font-bold text-gray-900">{fullPortions}</p>
            <p className="text-xs text-gray-400">Porții întregi</p>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-sm">🍽</div>
          <div>
            <p className="text-xl font-bold text-gray-900">{halfPortions}</p>
            <p className="text-xs text-gray-400">Porții copil (½)</p>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm">🚫</div>
          <div>
            <p className="text-xl font-bold text-gray-900">{noPortions}</p>
            <p className="text-xs text-gray-400">Fără meniu</p>
          </div>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm">🎁</div>
          <div>
            <p className="text-xl font-bold text-rose-700">{marturii}</p>
            <p className="text-xs text-rose-400">Mărturii</p>
          </div>
        </div>
      </div>

      {/* Guest limit warning banner */}
      {nearGuestLimit && limits.maxGuests !== null && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-amber-800">
            <span className="text-base">⚠️</span>
            <span>
              Ai <strong>{guests.length}</strong> din <strong>{limits.maxGuests}</strong> invitați.
              Mai ai loc pentru <strong>{limits.maxGuests - guests.length}</strong>.
            </span>
          </div>
          <Link href="/upgrade" className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2">
            Upgrade →
          </Link>
        </div>
      )}
      {atGuestLimit && limits.maxGuests !== null && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-rose-800">
            <span className="text-base">🚫</span>
            <span>
              Ai atins limita de <strong>{limits.maxGuests}</strong> invitați a planului <strong>{planTier === 'free' ? 'Gratuit' : 'Basic'}</strong>.
              Nu mai poți adăuga.
            </span>
          </div>
          <button onClick={() => setShowUpgradeModal(true)} className="shrink-0 text-xs font-semibold text-rose-700 hover:text-rose-900 underline underline-offset-2">
            Upgrade →
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {/* Search + Add button stacked on the left */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <Input
            placeholder="Caută după nume sau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-72"
          />
          {canEdit && (
            atGuestLimit ? (
              <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50 w-full sm:w-72" onClick={() => setShowUpgradeModal(true)}>
                + Adaugă invitat
              </Button>
            ) : (
              <Button className="bg-rose-600 hover:bg-rose-700 w-full sm:w-72" onClick={openAdd}>
                + Adaugă invitat
              </Button>
            )
          )}
        </div>

        {/* Filters */}
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? 'all')}>
          <SelectTrigger className="sm:w-40">
            <SelectValue>{filterCategory === 'all' ? 'Toate' : CATEGORY_LABELS[filterCategory]}</SelectValue>
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
            <SelectValue>{filterRsvp === 'all' ? 'Toate statusurile' : RSVP_LABELS[filterRsvp]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            <SelectItem value="pending">În așteptare</SelectItem>
            <SelectItem value="confirmed">Confirmat</SelectItem>
            <SelectItem value="declined">Refuzat</SelectItem>
          </SelectContent>
        </Select>

        {/* Export buttons */}
        <div className="flex gap-2 sm:ml-auto flex-wrap">
          {guests.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleCsvExport}>
              📤 Export CSV
            </Button>
          )}
          {limits.pdfExport && guests.length > 0 && (
            <Button variant="outline" size="sm" onClick={handlePdfExport}>
              📄 Export PDF
            </Button>
          )}
          {canEdit && (
            <>
              <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleCsvImport} />
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} title="Descarcă fișier model pentru import">
                📋 Template Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                📥 Import Excel
              </Button>
            </>
          )}
        </div>
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
                      {(guest.table as { name: string } | null)?.name
                        ?? tables.find((t) => t.id === guest.table_id)?.name
                        ?? '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(guest)} className="text-gray-400 hover:text-gray-900" title="Editează">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(guest)} className="text-gray-300 hover:text-red-500" title="Șterge">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </Button>
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
                <input ref={nameRef} defaultValue={form.name} placeholder="Ion Popescu" required className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <input ref={emailRef} type="email" defaultValue={form.email} placeholder="ion@exemplu.ro" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors" />
              </div>
              <div className="space-y-1">
                <Label>Telefon</Label>
                <input ref={phoneRef} defaultValue={form.phone} placeholder="07xx xxx xxx" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors" />
              </div>
              <div className="space-y-1">
                <Label>Categorie</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v as Guest['category'] })}>
                  <SelectTrigger><SelectValue>{CATEGORY_LABELS[form.category]}</SelectValue></SelectTrigger>
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
                  <SelectTrigger><SelectValue>{RSVP_LABELS[form.rsvp_status]}</SelectValue></SelectTrigger>
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
                <>
                  <div className="col-span-2 space-y-1">
                    <Label>Numele însoțitorului</Label>
                    <input ref={plusOneNameRef} defaultValue={form.plus_one_name} placeholder="Maria Popescu" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Porție însoțitor</Label>
                    <Select value={form.plus_one_portion} onValueChange={(v) => v && setForm({ ...form, plus_one_portion: v as 'full' | 'half' | 'none' })}>
                      <SelectTrigger>
                        <SelectValue>{PORTION_LABELS[form.plus_one_portion]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Porție întreagă (adult)</SelectItem>
                        <SelectItem value="half">Porție copil (½)</SelectItem>
                        <SelectItem value="none">Copil fără meniu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-1">
                <Label>Preferințe alimentare</Label>
                <input ref={dietaryRef} defaultValue={form.dietary} placeholder="Vegetarian, alergii..." className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors" />
              </div>
              <div className="space-y-1">
                <Label>Notițe</Label>
                <input ref={notesRef} defaultValue={form.notes} placeholder="Orice detaliu util" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={loading}>
              {loading ? 'Se salvează...' : editing ? 'Salvează' : 'Adaugă invitat'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upgrade limit modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className={planTier === 'free' ? 'sm:max-w-md' : 'sm:max-w-sm'}>
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Limită atinsă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <p className="text-center text-gray-500 text-sm">
              Ai atins limita de <strong>{limits.maxGuests} invitați</strong> a planului <strong>{planTier === 'free' ? 'Gratuit' : 'Basic'}</strong>.
            </p>

            {planTier === 'free' ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Basic card */}
                <div className="rounded-xl border border-stone-200 p-4 space-y-3 flex flex-col">
                  <div>
                    <p className="font-semibold text-gray-900">Basic</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tot ce ai nevoie</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">79 <span className="text-sm font-normal text-gray-400">RON</span></p>
                  <ul className="space-y-1 text-xs text-gray-500 flex-1">
                    <li>✓ Până la 230 invitați</li>
                    <li>✓ Mese nelimitate</li>
                    <li>✓ Feed activitate live</li>
                  </ul>
                  <Link href="/upgrade?autostart=basic" className="block mt-auto">
                    <Button variant="outline" className="w-full text-sm border-stone-300" onClick={() => setShowUpgradeModal(false)}>
                      Alege Basic
                    </Button>
                  </Link>
                </div>
                {/* Pro card */}
                <div className="rounded-xl border-2 border-rose-500 bg-rose-50 p-4 space-y-3 flex flex-col relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    RECOMANDAT
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Pro</p>
                    <p className="text-xs text-gray-400 mt-0.5">Fără limite</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">109 <span className="text-sm font-normal text-gray-400">RON</span></p>
                  <ul className="space-y-1 text-xs text-gray-600 flex-1">
                    <li>✓ Invitați nelimitați</li>
                    <li>✓ Colaboratori nelimitați</li>
                    <li>✓ Export PDF plan mese</li>
                    <li>✓ Wedding Planner To-Do</li>
                  </ul>
                  <Link href="/upgrade?autostart=pro" className="block mt-auto">
                    <Button className="w-full text-sm bg-rose-600 hover:bg-rose-700" onClick={() => setShowUpgradeModal(false)}>
                      Alege Pro
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-center text-gray-500 text-sm">
                  Fă upgrade la <strong>Pro</strong> pentru invitați <strong>nelimitați</strong>, PDF export și Wedding Planner To-Do.
                </p>
                <Link href="/upgrade?autostart=pro" className="block">
                  <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={() => setShowUpgradeModal(false)}>
                    Upgrade la Pro — 109 RON
                  </Button>
                </Link>
              </div>
            )}

            <Button variant="ghost" className="w-full text-gray-400 text-sm" onClick={() => setShowUpgradeModal(false)}>
              Rămân pe planul curent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
