'use client'

import { useState, useEffect } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DroppableTable from './DroppableTable'
import DraggableGuest from './DraggableGuest'
import type { Guest, Table } from '@/types'

interface Props {
  eventId: string
  initialTables: (Table & { guests: Guest[] })[]
  initialUnassigned: Guest[]
  canEdit: boolean
}

export default function TablePlanner({ eventId, initialTables, initialUnassigned, canEdit }: Props) {
  const [tables, setTables] = useState(initialTables)
  const [unassigned, setUnassigned] = useState(initialUnassigned)
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState('8')
  const [newTableShape, setNewTableShape] = useState<'round' | 'rectangular'>('round')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  useEffect(() => {
    const channel = supabase
      .channel(`tables:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
        () => { window.location.reload() }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `event_id=eq.${eventId}` },
        () => { window.location.reload() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, supabase])

  function handleDragStart(event: DragStartEvent) {
    const guest = findGuest(String(event.active.id))
    setActiveGuest(guest)
  }

  function findGuest(id: string): Guest | null {
    const fromUnassigned = unassigned.find((g) => g.id === id)
    if (fromUnassigned) return fromUnassigned
    for (const table of tables) {
      const found = table.guests.find((g) => g.id === id)
      if (found) return found
    }
    return null
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveGuest(null)
    const { active, over } = event
    if (!over) return

    const guestId = String(active.id)
    const targetId = String(over.id)
    const guest = findGuest(guestId)
    if (!guest) return

    const targetTableId = targetId === 'unassigned' ? null : targetId
    if (guest.table_id === targetTableId) return

    const targetTable = targetTableId ? tables.find((t) => t.id === targetTableId) : null
    if (targetTable && targetTable.guests.length >= targetTable.capacity) return

    await supabase.from('guests').update({ table_id: targetTableId }).eq('id', guestId)

    setTables((prev) => prev.map((t) => {
      if (t.id === guest.table_id) return { ...t, guests: t.guests.filter((g) => g.id !== guestId) }
      if (t.id === targetTableId) return { ...t, guests: [...t.guests, { ...guest, table_id: targetTableId }] }
      return t
    }))

    if (targetTableId === null) {
      setUnassigned((prev) => [...prev, { ...guest, table_id: null }])
    } else {
      setUnassigned((prev) => prev.filter((g) => g.id !== guestId))
    }
  }

  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data } = await supabase
      .from('tables')
      .insert({
        event_id: eventId,
        name: newTableName,
        capacity: parseInt(newTableCapacity),
        shape: newTableShape,
      })
      .select()
      .single()
    if (data) {
      setTables((prev) => [...prev, { ...data, guests: [] }])
    }
    setNewTableName('')
    setNewTableCapacity('8')
    setCreateOpen(false)
    setLoading(false)
  }

  async function handleDeleteTable(tableId: string) {
    await supabase.from('tables').delete().eq('id', tableId)
    const removed = tables.find((t) => t.id === tableId)
    if (removed) {
      setUnassigned((prev) => [...prev, ...removed.guests.map((g) => ({ ...g, table_id: null }))])
    }
    setTables((prev) => prev.filter((t) => t.id !== tableId))
  }

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0)
  const occupiedSeats = tables.reduce((sum, t) => sum + t.guests.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>🪑 {occupiedSeats}/{totalSeats} locuri</span>
          <span>👥 {unassigned.length} neasignați</span>
        </div>
        {canEdit && (
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => setCreateOpen(true)}>
            + Masă nouă
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Unassigned sidebar */}
          <div className="lg:col-span-1">
            <DroppableTable
              id="unassigned"
              title="Neasignați"
              guests={unassigned}
              capacity={999}
              shape="rectangular"
              canEdit={canEdit}
              isUnassigned
            />
          </div>

          {/* Tables grid */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            {tables.length === 0 ? (
              <div className="col-span-2 py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                <div className="text-4xl mb-2">🪑</div>
                <p className="font-medium">Nicio masă creată</p>
                <p className="text-sm">Creează mese și trage invitații pe ele.</p>
              </div>
            ) : (
              tables.map((table) => (
                <DroppableTable
                  key={table.id}
                  id={table.id}
                  title={table.name}
                  guests={table.guests}
                  capacity={table.capacity}
                  shape={table.shape}
                  canEdit={canEdit}
                  onDelete={canEdit ? () => handleDeleteTable(table.id) : undefined}
                />
              ))
            )}
          </div>
        </div>

        <DragOverlay>
          {activeGuest && (
            <div className="bg-white border border-rose-300 shadow-lg rounded-lg px-3 py-2 text-sm font-medium cursor-grabbing">
              {activeGuest.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Masă nouă</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTable} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Numele mesei *</Label>
              <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="Masa 1 / Familia miresei" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Locuri</Label>
                <Input type="number" min={1} max={30} value={newTableCapacity} onChange={(e) => setNewTableCapacity(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Formă</Label>
                <Select value={newTableShape} onValueChange={(v) => setNewTableShape(v as 'round' | 'rectangular')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Rotundă</SelectItem>
                    <SelectItem value="rectangular">Dreptunghiulară</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={loading || !newTableName}>
              {loading ? 'Se creează...' : 'Creează masa'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
