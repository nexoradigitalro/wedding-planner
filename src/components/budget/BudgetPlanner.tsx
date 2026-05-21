'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { BudgetItem } from '@/types'

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  venue:       { label: 'Sală / Locație',      emoji: '🏛️' },
  catering:    { label: 'Catering / Mâncare',   emoji: '🍽️' },
  photo:       { label: 'Foto / Video',          emoji: '📸' },
  music:       { label: 'Muzică / DJ',           emoji: '🎵' },
  flowers:     { label: 'Flori / Decorațiuni',   emoji: '💐' },
  dress:       { label: 'Rochie / Costum',        emoji: '👗' },
  rings:       { label: 'Verighete',              emoji: '💍' },
  invitations: { label: 'Invitații',              emoji: '✉️' },
  transport:   { label: 'Transport',              emoji: '🚗' },
  honeymoon:   { label: 'Luna de miere',          emoji: '🌴' },
  other:       { label: 'Altele',                 emoji: '📦' },
}

const emptyForm = { name: '', category: 'venue', estimated: '', paid: '', notes: '' }

interface Props {
  eventId: string
  initialItems: BudgetItem[]
  canEdit: boolean
}

function fmt(n: number) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' RON'
}

export default function BudgetPlanner({ eventId, initialItems, canEdit }: Props) {
  const [items, setItems] = useState<BudgetItem[]>(initialItems)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const totalEstimated = items.reduce((s, i) => s + Number(i.estimated_amount), 0)
  const totalPaid = items.reduce((s, i) => s + Number(i.paid_amount), 0)
  const totalLeft = totalEstimated - totalPaid
  const paidPct = totalEstimated > 0 ? Math.min(100, Math.round((totalPaid / totalEstimated) * 100)) : 0

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(item: BudgetItem) {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category,
      estimated: item.estimated_amount > 0 ? String(item.estimated_amount) : '',
      paid: item.paid_amount > 0 ? String(item.paid_amount) : '',
      notes: item.notes ?? '',
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      event_id: eventId,
      name: form.name.trim(),
      category: form.category,
      estimated_amount: parseFloat(form.estimated) || 0,
      paid_amount: parseFloat(form.paid) || 0,
      notes: form.notes.trim() || null,
    }
    if (!payload.name) { toast.error('Denumirea este obligatorie'); setLoading(false); return }

    if (editing) {
      const { error } = await supabase.from('budget_items').update(payload).eq('id', editing.id)
      if (error) { toast.error('Eroare: ' + error.message); setLoading(false); return }
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...payload } : i))
      toast.success('Actualizat')
    } else {
      const { data, error } = await supabase.from('budget_items').insert(payload).select().single()
      if (error) { toast.error('Eroare: ' + error.message); setLoading(false); return }
      if (data) setItems(prev => [...prev, data as BudgetItem])
      toast.success('Cheltuială adăugată')
    }
    setOpen(false)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('budget_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Șters')
  }

  // Group by category in CATEGORIES order
  const grouped: Record<string, BudgetItem[]> = {}
  for (const cat of Object.keys(CATEGORIES)) {
    const catItems = items.filter(i => i.category === cat)
    if (catItems.length > 0) grouped[cat] = catItems
  }
  // Unknown categories → other
  items.forEach(i => {
    if (!CATEGORIES[i.category]) {
      if (!grouped.other) grouped.other = []
      if (!grouped.other.find(x => x.id === i.id)) grouped.other.push(i)
    }
  })

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total estimat', value: fmt(totalEstimated), color: 'text-gray-900' },
          { label: 'Plătit', value: fmt(totalPaid), color: 'text-green-600' },
          { label: 'Rămas de plătit', value: fmt(Math.max(0, totalLeft)), color: totalLeft > 0 ? 'text-rose-600' : 'text-green-600' },
          { label: 'Acoperit', value: `${paidPct}%`, color: paidPct >= 100 ? 'text-green-600' : paidPct > 50 ? 'text-amber-500' : 'text-rose-500' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalEstimated > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Plătit: <strong className="text-green-600">{fmt(totalPaid)}</strong></span>
            <span>Rămas: <strong className="text-rose-500">{fmt(Math.max(0, totalLeft))}</strong></span>
          </div>
          <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${paidPct >= 100 ? 'bg-green-500' : 'bg-rose-500'}`}
              style={{ width: `${paidPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">{paidPct}% din buget achitat</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{items.length} {items.length === 1 ? 'cheltuială' : 'cheltuieli'} înregistrate</p>
        {canEdit && (
          <Button className="bg-rose-600 hover:bg-rose-700" onClick={openAdd}>
            + Adaugă cheltuială
          </Button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-stone-300 p-12 text-center">
          <div className="text-4xl mb-3">💰</div>
          <p className="font-medium text-gray-700">Nicio cheltuială adăugată</p>
          <p className="text-sm text-gray-400 mt-1">Adaugă cheltuielile planificate: sală, catering, foto...</p>
        </div>
      )}

      {/* Items by category */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, catItems]) => {
          const def = CATEGORIES[cat] ?? CATEGORIES.other
          const catEst = catItems.reduce((s, i) => s + Number(i.estimated_amount), 0)
          const catPaid = catItems.reduce((s, i) => s + Number(i.paid_amount), 0)
          const catLeft = catEst - catPaid
          return (
            <div key={cat} className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
              {/* Category header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200">
                <span className="font-semibold text-sm text-gray-800">{def.emoji} {def.label}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500">Estimat: <strong>{fmt(catEst)}</strong></span>
                  <span className="text-green-600">Plătit: <strong>{fmt(catPaid)}</strong></span>
                  {catLeft > 0 && <span className="text-rose-500">Rămas: <strong>{fmt(catLeft)}</strong></span>}
                </div>
              </div>
              {/* Items */}
              <div className="divide-y divide-stone-100">
                {catItems.map(item => {
                  const left = Number(item.estimated_amount) - Number(item.paid_amount)
                  const isPaid = left <= 0
                  const hasPartial = !isPaid && Number(item.paid_amount) > 0
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isPaid ? 'bg-green-500' : hasPartial ? 'bg-amber-400' : 'bg-stone-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        {item.notes && <p className="text-xs text-gray-400 truncate">{item.notes}</p>}
                      </div>
                      <div className="text-right text-xs shrink-0 space-y-0.5">
                        <p className="text-gray-400">{fmt(Number(item.estimated_amount))} estimat</p>
                        <p className="text-green-600 font-semibold">{fmt(Number(item.paid_amount))} plătit</p>
                        {!isPaid && Number(item.estimated_amount) > 0 && (
                          <p className="text-rose-500">{fmt(left)} rămas</p>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 shrink-0 ml-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-stone-100 transition-colors"
                            title="Editează"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Șterge"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editează cheltuială' : 'Cheltuială nouă'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Denumire *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="ex: Restaurant Belvedere"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Categorie</Label>
              <Select value={form.category} onValueChange={v => v && setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue>
                    {CATEGORIES[form.category]?.emoji} {CATEGORIES[form.category]?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Estimat (RON)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.estimated}
                  onChange={e => setForm({ ...form, estimated: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-1">
                <Label>Plătit (RON)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.paid}
                  onChange={e => setForm({ ...form, paid: e.target.value })}
                  placeholder="2500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notițe</Label>
              <Input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Avans plătit, rest la eveniment..."
              />
            </div>
            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={loading || !form.name.trim()}>
              {loading ? 'Se salvează...' : editing ? 'Salvează' : 'Adaugă'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
