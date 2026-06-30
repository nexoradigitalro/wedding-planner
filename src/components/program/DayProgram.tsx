'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { WeddingProgramItem } from '@/types/database'

interface Props {
  eventId: string
  eventName: string
  eventDate: string | null
  initialItems: WeddingProgramItem[]
  canEdit: boolean
  planTier: string
}

const EMPTY_FORM = {
  location: '',
  moment: '',
  start_time: '',
  end_time: '',
  responsible: '',
  details: '',
  important_notes: '',
}

export default function DayProgram({ eventId, eventName, eventDate, initialItems, canEdit }: Props) {
  const [items, setItems] = useState<WeddingProgramItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(item: WeddingProgramItem) {
    setEditingId(item.id)
    setForm({
      location: item.location ?? '',
      moment: item.moment,
      start_time: item.start_time ?? '',
      end_time: item.end_time ?? '',
      responsible: item.responsible ?? '',
      details: item.details ?? '',
      important_notes: item.important_notes ?? '',
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.moment.trim()) return toast.error('Completează numele momentului')
    setLoading(true)
    const payload = {
      event_id: eventId,
      location: form.location || null,
      moment: form.moment.trim(),
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      responsible: form.responsible || null,
      details: form.details || null,
      important_notes: form.important_notes || null,
      order_index: items.length,
    }

    if (editingId) {
      const { data, error } = await supabase
        .from('wedding_program')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()
      if (error) { toast.error('Eroare la salvare'); setLoading(false); return }
      setItems(prev => prev.map(i => i.id === editingId ? data : i))
      toast.success('Moment actualizat')
    } else {
      const { data, error } = await supabase
        .from('wedding_program')
        .insert(payload)
        .select()
        .single()
      if (error) { toast.error('Eroare la adăugare'); setLoading(false); return }
      setItems(prev => [...prev, data])
      toast.success('Moment adăugat')
    }
    setLoading(false)
    closeForm()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('wedding_program').delete().eq('id', id)
    if (error) return toast.error('Eroare la ștergere')
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Moment șters')
  }

  function exportPdf() {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 14
      let y = 20

      const pdfSafe = (str: string) => str.replace(/ș/g, 's').replace(/ț/g, 't').replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i').replace(/Ș/g, 'S').replace(/Ț/g, 'T').replace(/Ă/g, 'A').replace(/Â/g, 'A').replace(/Î/g, 'I')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text(pdfSafe(eventName), pageW / 2, y, { align: 'center' })
      y += 8

      if (eventDate) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.text(new Date(eventDate).toLocaleDateString('ro-RO'), pageW / 2, y, { align: 'center' })
        y += 6
      }

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Program Ziua Nuntii', pageW / 2, y, { align: 'center' })
      y += 10

      items.forEach((item) => {
        if (y > 260) { doc.addPage(); y = 20 }

        doc.setFillColor(252, 241, 244)
        doc.roundedRect(margin, y - 4, pageW - margin * 2, 7, 1, 1, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(225, 29, 72)
        const time = [item.start_time, item.end_time].filter(Boolean).map(t => t!.slice(0, 5)).join(' - ')
        if (time) doc.text(time, margin + 2, y + 1)

        doc.setTextColor(30, 30, 30)
        doc.setFontSize(11)
        doc.text(pdfSafe(item.moment.toUpperCase()), time ? margin + 28 : margin + 2, y + 1)
        y += 9

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)

        if (item.location) {
          doc.text(pdfSafe(`Locatie: ${item.location}`), margin + 2, y)
          y += 5
        }
        if (item.responsible) {
          doc.text(pdfSafe(`Responsabil: ${item.responsible}`), margin + 2, y)
          y += 5
        }
        if (item.details) {
          const lines = doc.splitTextToSize(pdfSafe(item.details), pageW - margin * 2 - 4)
          doc.text(lines, margin + 2, y)
          y += lines.length * 4 + 2
        }
        if (item.important_notes) {
          doc.setTextColor(180, 30, 30)
          const lines = doc.splitTextToSize(pdfSafe(`! ${item.important_notes}`), pageW - margin * 2 - 4)
          doc.text(lines, margin + 2, y)
          doc.setTextColor(80, 80, 80)
          y += lines.length * 4 + 2
        }
        y += 4
      })

      doc.save(pdfSafe(`program-${eventName}.pdf`))
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900">
            Program Ziua Nunții
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Cronologia completă a evenimentului</p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={exportPdf}
              className="px-4 py-2 rounded-full text-sm font-medium border border-stone-200 text-gray-600 hover:border-rose-300 hover:text-rose-600 transition-colors"
            >
              Export PDF
            </button>
          )}
          {canEdit && (
            <button
              onClick={openAdd}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              + Moment nou
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">{editingId ? 'Editează moment' : 'Moment nou'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Moment *</label>
              <input
                type="text"
                placeholder="ex: CEREMONIE RELIGIOASĂ"
                value={form.moment}
                onChange={e => setForm(f => ({ ...f, moment: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Oră start (00:00 – 23:59)</label>
              <input
                type="text"
                placeholder="14:30"
                maxLength={5}
                value={form.start_time}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
                  const v = raw.length > 2 ? raw.slice(0, 2) + ':' + raw.slice(2) : raw
                  setForm(f => ({ ...f, start_time: v }))
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Oră final (00:00 – 23:59)</label>
              <input
                type="text"
                placeholder="16:00"
                maxLength={5}
                value={form.end_time}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
                  const v = raw.length > 2 ? raw.slice(0, 2) + ':' + raw.slice(2) : raw
                  setForm(f => ({ ...f, end_time: v }))
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Locație</label>
              <input
                type="text"
                placeholder="ex: Biserica Seușa"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Responsabil</label>
              <input
                type="text"
                placeholder="ex: Alina, foto-video"
                value={form.responsible}
                onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Detalii organizare</label>
              <textarea
                placeholder="Instrucțiuni detaliate..."
                value={form.details}
                onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Elemente importante</label>
              <textarea
                placeholder="Note importante, obiecte necesare..."
                value={form.important_notes}
                onChange={e => setForm(f => ({ ...f, important_notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-400 resize-none bg-rose-50/30"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={closeForm} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 border border-stone-200">
              Anulează
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60"
            >
              {loading ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 py-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-700">Niciun moment adăugat</p>
          <p className="text-sm text-gray-400 mt-1">Adaugă momentele zilei în ordine cronologică.</p>
          {canEdit && (
            <button
              onClick={openAdd}
              className="mt-4 px-5 py-2 rounded-full text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              + Adaugă primul moment
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="relative flex gap-4">
              {/* Time column */}
              <div className="w-24 shrink-0 text-right pt-3">
                {item.start_time && (
                  <span className="text-sm font-semibold text-rose-600 font-mono">
                    {item.start_time.slice(0, 5)}
                  </span>
                )}
                {item.end_time && (
                  <span className="block text-xs text-gray-400 font-mono">{item.end_time.slice(0, 5)}</span>
                )}
              </div>

              {/* Line */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-rose-500 mt-3.5 shrink-0 ring-2 ring-white ring-offset-1" />
                {idx < items.length - 1 && <div className="w-0.5 flex-1 bg-stone-200 mt-1" />}
              </div>

              {/* Card */}
              <div className="flex-1 bg-white rounded-2xl border border-stone-200 p-4 mb-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                        {item.moment}
                      </h3>
                      {item.location && (
                        <span className="text-xs text-gray-400 bg-stone-100 px-2 py-0.5 rounded-full">
                          {item.location}
                        </span>
                      )}
                      {item.responsible && (
                        <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          {item.responsible}
                        </span>
                      )}
                    </div>
                    {item.details && (
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed whitespace-pre-wrap">
                        {item.details}
                      </p>
                    )}
                    {item.important_notes && (
                      <div className={cn('mt-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200')}>
                        <p className="text-xs font-semibold text-amber-700 mb-0.5">Elemente importante</p>
                        <p className="text-sm text-amber-800 whitespace-pre-wrap">{item.important_notes}</p>
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-stone-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
