'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DroppableTable from './DroppableTable'
import { cn } from '@/lib/utils'
import { PLAN_LIMITS } from '@/types'
import type { Guest, Table, VenueElement } from '@/types'
import Link from 'next/link'

const CANVAS_W = 2600
const CANVAS_H = 1800

// Basket-weave parquet floor SVG — alternating horizontal/vertical plank direction per quadrant
const FLOOR_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f2e4cc'/%3E%3Crect x='0' y='0' width='40' height='40' fill='%23ede0c0'/%3E%3Cline x1='0' y1='14' x2='40' y2='14' stroke='%23c09858' stroke-width='.35' opacity='.28'/%3E%3Cline x1='0' y1='27' x2='40' y2='27' stroke='%23c09858' stroke-width='.35' opacity='.28'/%3E%3Crect x='40' y='0' width='40' height='40' fill='%23e4d4b0'/%3E%3Cline x1='54' y1='0' x2='54' y2='40' stroke='%23c09858' stroke-width='.35' opacity='.28'/%3E%3Cline x1='67' y1='0' x2='67' y2='40' stroke='%23c09858' stroke-width='.35' opacity='.28'/%3E%3Crect x='0' y='40' width='40' height='40' fill='%23e4d4b0'/%3E%3Cline x1='14' y1='40' x2='14' y2='80' stroke='%23c09858' stroke-width='.35' opacity='.28'/%3E%3Cline x1='27' y1='40' x2='27' y2='80' stroke='%23c09858' stroke-width='.35' opacity='.28'/%3E%3Crect x='40' y='40' width='40' height='40' fill='%23ede0c0'/%3E%3Cline x1='40' y1='54' x2='80' y2='54' stroke='%23c09858' stroke-width='.35' opacity='.28'/%3E%3Cline x1='40' y1='67' x2='80' y2='67' stroke='%23c09858' stroke-width='.35' opacity='.28'/%3E%3Cline x1='40' y1='0' x2='40' y2='80' stroke='%23a87840' stroke-width='.7' opacity='.3'/%3E%3Cline x1='0' y1='40' x2='80' y2='40' stroke='%23a87840' stroke-width='.7' opacity='.3'/%3E%3C/svg%3E")`

const ELEMENT_DEFS: Record<string, { label: string; emoji: string; w: number; h: number; bg: string; border: string }> = {
  dance_floor: { label: 'Ring de dans',  emoji: '💃', w: 220, h: 160, bg: '#fef9c3', border: '#fde047' },
  candy_bar:   { label: 'Candy Bar',     emoji: '🍬', w: 130, h: 95,  bg: '#fce7f3', border: '#f9a8d4' },
  photo_booth: { label: 'Photo Booth',   emoji: '📸', w: 120, h: 90,  bg: '#f0fdf4', border: '#86efac' },
  photo_360:   { label: '360° Photo',    emoji: '🎥', w: 130, h: 100, bg: '#eff6ff', border: '#93c5fd' },
  dj_booth:    { label: 'DJ',            emoji: '🎧', w: 140, h: 85,  bg: '#f5f3ff', border: '#c4b5fd' },
  bar:         { label: 'Bar',           emoji: '🍹', w: 170, h: 75,  bg: '#fff7ed', border: '#fdba74' },
  live_band:   { label: 'Trupă live',    emoji: '🎵', w: 200, h: 120, bg: '#f0fdf4', border: '#6ee7b7' },
  entrance:    { label: 'Intrare',       emoji: '🚪', w: 90,  h: 55,  bg: '#f8fafc', border: '#cbd5e1' },
}

interface TablePos { x: number; y: number }
interface CanvasDrag {
  type: 'table' | 'element'
  mode: 'move' | 'resize'
  id: string
  startCX: number
  startCY: number
  origX: number
  origY: number
  curX: number
  curY: number
  origW: number
  origH: number
  curW: number
  curH: number
}

interface Props {
  eventId: string
  userId: string
  initialTables: (Table & { guests: Guest[] })[]
  initialUnassigned: Guest[]
  initialVenueElements: VenueElement[]
  canEdit: boolean
  planTier: string
}

function autoLayout(tables: (Table & { guests: Guest[] })[]): Record<string, TablePos> {
  const COLS = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(tables.length))))
  return Object.fromEntries(tables.map((t, i) => [
    t.id,
    (t.position_x > 0 || t.position_y > 0)
      ? { x: t.position_x, y: t.position_y }
      : { x: 80 + (i % COLS) * 340, y: 80 + Math.floor(i / COLS) * 340 },
  ]))
}

export default function TablePlanner({
  eventId, userId, initialTables, initialUnassigned, initialVenueElements, canEdit, planTier,
}: Props) {
  const [tables, setTables] = useState(initialTables)
  const [unassigned, setUnassigned] = useState(initialUnassigned)
  const [positions, setPositions] = useState<Record<string, TablePos>>(() => autoLayout(initialTables))
  const [venueElements, setVenueElements] = useState<VenueElement[]>(initialVenueElements)
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState('8')
  const [newTableShape, setNewTableShape] = useState<'round' | 'rectangular' | 'head'>('round')
  const [loading, setLoading] = useState(false)
  const [addElementOpen, setAddElementOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<(Table & { guests: Guest[] }) | null>(null)
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState('8')

  const [zoom, setZoom] = useState(1)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightCategory, setHighlightCategory] = useState<string | null>(null)

  const [tableScales, setTableScales] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(`table_scales_${eventId}`) ?? '{}') } catch { return {} }
  })
  const [lockedTables, setLockedTables] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem(`locked_tables_${eventId}`) ?? '[]')) } catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem(`table_scales_${eventId}`, JSON.stringify(tableScales))
  }, [tableScales, eventId])

  useEffect(() => {
    localStorage.setItem(`locked_tables_${eventId}`, JSON.stringify([...lockedTables]))
  }, [lockedTables, eventId])

  function adjustScale(tableId: string, delta: number) {
    setTableScales(prev => ({ ...prev, [tableId]: Math.max(0.4, Math.min(1.3, parseFloat(((prev[tableId] ?? 1) + delta).toFixed(2)))) }))
  }

  function toggleLock(tableId: string) {
    setLockedTables(prev => { const s = new Set(prev); s.has(tableId) ? s.delete(tableId) : s.add(tableId); return s })
  }

  const searchResult = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null
    for (const t of tables) {
      const g = t.guests.find(g =>
        g.name.toLowerCase().includes(q) || (g.plus_one_name?.toLowerCase().includes(q))
      )
      if (g) return { guest: g, tableName: t.name }
    }
    const g = unassigned.find(g => g.name.toLowerCase().includes(q))
    if (g) return { guest: g, tableName: null }
    return undefined
  }, [searchQuery, tables, unassigned])

  const CATEGORY_LABELS: Record<string, { label: string; color: string; ring: string }> = {
    family:    { label: 'Familie',  color: 'bg-purple-100 text-purple-700 border-purple-300', ring: '#c4b5fd' },
    friends:   { label: 'Prieteni', color: 'bg-blue-100 text-blue-700 border-blue-300',       ring: '#93c5fd' },
    coworkers: { label: 'Colegi',   color: 'bg-orange-100 text-orange-700 border-orange-300', ring: '#fdba74' },
    kids:      { label: 'Copii',    color: 'bg-pink-100 text-pink-700 border-pink-300',        ring: '#f9a8d4' },
  }
  const canvasDragRef = useRef<CanvasDrag | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  // Refs for stable access inside window event listeners
  const posRef = useRef(positions)
  const elemRef = useRef(venueElements)
  const zoomRef = useRef(zoom)
  useEffect(() => { posRef.current = positions }, [positions])
  useEffect(() => { elemRef.current = venueElements }, [venueElements])
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  // Wheel zoom on canvas — needs passive:false to call preventDefault
  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      setZoom(z => Math.max(0.25, Math.min(2, parseFloat((z - e.deltaY * 0.001).toFixed(3)))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const supabase = createClient()
  const limits = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.free
  const atTableLimit = limits.maxTables !== null && tables.length >= limits.maxTables

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`tables-rt:${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` }, (payload) => {
        const g = payload.new as Guest
        setTables(prev => prev.map(t => {
          const without = t.guests.filter(x => x.id !== g.id)
          return t.id === g.table_id ? { ...t, guests: [...without, g] } : { ...t, guests: without }
        }))
        setUnassigned(prev => {
          const without = prev.filter(x => x.id !== g.id)
          return g.table_id === null ? [...without, g] : without
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tables', filter: `event_id=eq.${eventId}` }, (payload) => {
        setTables(prev => {
          if (prev.find(t => t.id === payload.new.id)) return prev
          return [...prev, { ...(payload.new as Table), guests: [] }]
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tables', filter: `event_id=eq.${eventId}` }, (payload) => {
        setTables(prev => prev.filter(t => t.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  // Canvas drag: table / element repositioning via mouse
  const startCanvasDrag = useCallback((
    e: React.MouseEvent,
    id: string,
    type: 'table' | 'element',
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const origX = type === 'table'
      ? (posRef.current[id]?.x ?? 0)
      : (elemRef.current.find(v => v.id === id)?.position_x ?? 0)
    const origY = type === 'table'
      ? (posRef.current[id]?.y ?? 0)
      : (elemRef.current.find(v => v.id === id)?.position_y ?? 0)
    canvasDragRef.current = {
      type, mode: 'move', id,
      startCX: e.clientX, startCY: e.clientY,
      origX, origY, curX: origX, curY: origY,
      origW: 0, origH: 0, curW: 0, curH: 0,
    }
    setDraggingId(id)
  }, [])

  const startResizeDrag = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const el = elemRef.current.find(v => v.id === id)
    if (!el) return
    canvasDragRef.current = {
      type: 'element', mode: 'resize', id,
      startCX: e.clientX, startCY: e.clientY,
      origX: el.position_x, origY: el.position_y,
      curX: el.position_x, curY: el.position_y,
      origW: el.width, origH: el.height,
      curW: el.width, curH: el.height,
    }
    setDraggingId(id)
  }, [])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = canvasDragRef.current
      if (!d) return
      const z = zoomRef.current
      if (d.mode === 'resize') {
        const nw = Math.max(60, d.origW + (e.clientX - d.startCX) / z)
        const nh = Math.max(40, d.origH + (e.clientY - d.startCY) / z)
        d.curW = nw; d.curH = nh
        setVenueElements(prev => prev.map(el => el.id === d.id ? { ...el, width: nw, height: nh } : el))
      } else {
        const nx = Math.max(0, d.origX + (e.clientX - d.startCX) / z)
        const ny = Math.max(0, d.origY + (e.clientY - d.startCY) / z)
        d.curX = nx; d.curY = ny
        if (d.type === 'table') {
          setPositions(prev => ({ ...prev, [d.id]: { x: nx, y: ny } }))
        } else {
          setVenueElements(prev => prev.map(el => el.id === d.id ? { ...el, position_x: nx, position_y: ny } : el))
        }
      }
    }
    function onUp() {
      const d = canvasDragRef.current
      if (!d) return
      canvasDragRef.current = null
      setDraggingId(null)
      if (d.mode === 'resize') {
        if (!d.id.startsWith('local_')) {
          supabase.from('venue_elements').update({ width: Math.round(d.curW), height: Math.round(d.curH) }).eq('id', d.id).then()
        }
      } else if (d.type === 'table') {
        supabase.from('tables').update({ position_x: d.curX, position_y: d.curY }).eq('id', d.id).then()
      } else if (!d.id.startsWith('local_')) {
        supabase.from('venue_elements').update({ position_x: d.curX, position_y: d.curY }).eq('id', d.id).then()
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, []) // stable — only uses refs

  // Guest DnD helpers
  function findGuest(id: string): Guest | null {
    const g = unassigned.find(g => g.id === id)
    if (g) return g
    for (const t of tables) {
      const f = t.guests.find(g => g.id === id)
      if (f) return f
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveGuest(findGuest(String(event.active.id)))
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
    const targetTable = targetTableId ? tables.find(t => t.id === targetTableId) : null
    if (targetTable) {
      const occ = targetTable.guests.reduce((s, g) => s + 1 + (g.has_plus_one ? 1 : 0), 0)
      const seats = 1 + (guest.has_plus_one ? 1 : 0)
      if (occ + seats > targetTable.capacity) return
    }
    setTables(prev => prev.map(t => {
      if (t.id === guest.table_id) return { ...t, guests: t.guests.filter(g => g.id !== guestId) }
      if (t.id === targetTableId) return { ...t, guests: [...t.guests, { ...guest, table_id: targetTableId }] }
      return t
    }))
    if (targetTableId === null) {
      setUnassigned(prev => [...prev, { ...guest, table_id: null }])
    } else {
      setUnassigned(prev => prev.filter(g => g.id !== guestId))
    }
    await supabase.from('guests').update({ table_id: targetTableId }).eq('id', guestId)
    const fromTable = guest.table_id ? tables.find(t => t.id === guest.table_id) : null
    await supabase.from('activity_log').insert({
      event_id: eventId, user_id: userId, action: 'guest_moved',
      payload: { guest_name: guest.name, from_table: fromTable?.name ?? null, to_table: targetTable?.name ?? null },
    })
  }

  function nextFreePos(): TablePos {
    const vals = Object.values(positions)
    if (!vals.length) return { x: 80, y: 80 }
    const maxY = Math.max(...vals.map(p => p.y))
    const row = vals.filter(p => p.y === maxY)
    const maxX = Math.max(...row.map(p => p.x))
    return maxX + 380 < CANVAS_W ? { x: maxX + 340, y: maxY } : { x: 80, y: maxY + 340 }
  }

  async function handleCreateTable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const pos = nextFreePos()
    const { data } = await supabase.from('tables').insert({
      event_id: eventId, name: newTableName,
      capacity: parseInt(newTableCapacity), shape: newTableShape,
      position_x: pos.x, position_y: pos.y,
    }).select().single()
    if (data) {
      setTables(prev => [...prev, { ...data, guests: [] }])
      setPositions(prev => ({ ...prev, [data.id]: pos }))
      await supabase.from('activity_log').insert({
        event_id: eventId, user_id: userId, action: 'table_added', payload: { table_name: newTableName },
      })
    }
    setNewTableName(''); setNewTableCapacity('8'); setNewTableShape('round')
    setCreateOpen(false); setLoading(false)
  }

  async function handleDeleteTable(tableId: string) {
    const removed = tables.find(t => t.id === tableId)
    await supabase.from('tables').delete().eq('id', tableId)
    if (removed) {
      setUnassigned(prev => [...prev, ...removed.guests.map(g => ({ ...g, table_id: null }))])
      await supabase.from('activity_log').insert({
        event_id: eventId, user_id: userId, action: 'table_removed', payload: { table_name: removed.name },
      })
    }
    setTables(prev => prev.filter(t => t.id !== tableId))
    setPositions(prev => { const p = { ...prev }; delete p[tableId]; return p })
  }

  function handleAddElement(type: string) {
    const def = ELEMENT_DEFS[type]
    if (!def) return

    // Stack new elements diagonally so they don't overlap each other
    const offset = venueElements.length * 30
    const newEl: VenueElement = {
      id: `local_${Date.now()}`,
      event_id: eventId,
      type,
      label: def.label,
      position_x: 50 + offset,
      position_y: 20 + offset,
      width: def.w,
      height: def.h,
      created_at: new Date().toISOString(),
    }
    setVenueElements(prev => [...prev, newEl])
    setAddElementOpen(false)

    // Persist to DB in background — if table doesn't exist yet, silently ignored
    supabase.from('venue_elements').insert({
      event_id: eventId, type, label: def.label,
      position_x: newEl.position_x, position_y: newEl.position_y,
      width: def.w, height: def.h,
    }).select().single().then(({ data }) => {
      if (data) {
        setVenueElements(prev => prev.map(el => el.id === newEl.id ? (data as VenueElement) : el))
      }
    })
  }

  function handleDeleteElement(id: string) {
    setVenueElements(prev => prev.filter(el => el.id !== id))
    if (!id.startsWith('local_')) {
      supabase.from('venue_elements').delete().eq('id', id).then()
    }
  }

  function openEditTable(table: Table & { guests: Guest[] }) {
    setEditingTable(table)
    setEditName(table.name)
    setEditCapacity(String(table.capacity))
    setEditOpen(true)
  }

  async function handleEditTable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingTable) return
    setLoading(true)
    const name = editName.trim()
    const capacity = parseInt(editCapacity)
    if (!name || isNaN(capacity)) { setLoading(false); return }
    await supabase.from('tables').update({ name, capacity }).eq('id', editingTable.id)
    setTables(prev => prev.map(t => t.id === editingTable.id ? { ...t, name, capacity } : t))
    setEditOpen(false)
    setLoading(false)
  }

  function openHeadTable() {
    setNewTableName('Masa Mirilor')
    setNewTableShape('head')
    setNewTableCapacity('6')
    setCreateOpen(true)
  }

  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0)
  const occupiedSeats = tables.reduce((s, t) => s + t.guests.reduce((a, g) => a + 1 + (g.has_plus_one ? 1 : 0), 0), 0)
  const unassignedCount = unassigned.reduce((s, g) => s + 1 + (g.has_plus_one ? 1 : 0), 0)

  return (
    <div className="flex flex-col gap-3 md:h-[calc(100vh-180px)]">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 bg-white rounded-xl px-4 py-2.5 border border-stone-200 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>🪑 {occupiedSeats}/{totalSeats} locuri ocupate</span>
          <span>👥 {unassignedCount} neasignați</span>
          <span>🗂 {tables.length} mese</span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setZoom(z => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))))}
              className="w-7 h-7 rounded border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center font-bold text-slate-600 leading-none"
              title="Micșorează"
            >−</button>
            <button
              onClick={() => setZoom(1)}
              className="w-14 h-7 rounded border border-stone-200 bg-white hover:bg-stone-100 text-xs text-center text-slate-600 font-medium"
              title="Resetează zoom"
            >{Math.round(zoom * 100)}%</button>
            <button
              onClick={() => setZoom(z => Math.min(2, parseFloat((z + 0.25).toFixed(2))))}
              className="w-7 h-7 rounded border border-stone-200 bg-white hover:bg-stone-100 flex items-center justify-center font-bold text-slate-600 leading-none"
              title="Mărește"
            >+</button>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={openHeadTable}>
              💒 Masa Mirilor
            </Button>
            <Button size="sm" variant="outline" className="border-sky-300 text-sky-700 hover:bg-sky-50" onClick={() => setAddElementOpen(true)}>
              + Element sală
            </Button>
            {atTableLimit ? (
              <Link href="/upgrade">
                <Button size="sm" variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50">
                  Limită {limits.maxTables} mese — Upgrade
                </Button>
              </Link>
            ) : (
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => setCreateOpen(true)}>
                + Masă nouă
              </Button>
            )}
          </div>
        )}
        </div>
        {/* Search + category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              placeholder="Caută invitat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 text-xs rounded-lg border border-stone-200 px-3 pr-8 outline-none focus:border-rose-400 w-44"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs">✕</button>
            )}
          </div>
          {searchQuery && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              searchResult === undefined ? 'bg-red-50 text-red-500' :
              searchResult?.tableName ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {searchResult === undefined ? 'Negăsit' :
               searchResult?.tableName ? `→ ${searchResult.tableName}` :
               '→ Neasignat'}
            </span>
          )}
          <div className="h-4 w-px bg-stone-200 mx-1" />
          {Object.entries(CATEGORY_LABELS).map(([cat, cfg]) => (
            <button
              key={cat}
              onClick={() => setHighlightCategory(h => h === cat ? null : cat)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                highlightCategory === cat ? cfg.color + ' shadow-sm' : 'bg-white text-gray-400 border-stone-200 hover:border-stone-300'
              }`}
            >
              {cfg.label}
            </button>
          ))}
          {highlightCategory && (
            <button onClick={() => setHighlightCategory(null)} className="text-xs text-gray-400 hover:text-gray-700">✕ Resetează</button>
          )}
        </div>
      </div>

      {/* Mobile list view */}
      <div className="md:hidden space-y-3 overflow-y-auto pb-4">
        {unassigned.length > 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Neasignați ({unassigned.length})</p>
            <div className="space-y-2">
              {unassigned.map((g) => {
                const catCfg = CATEGORY_LABELS[g.category]
                return (
                  <div key={g.id} className="flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${catCfg?.color ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {catCfg?.label ?? g.category}
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate">{g.name}{g.has_plus_one ? ` +1` : ''}</span>
                    </div>
                    {canEdit && (
                      <select
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-rose-400 shrink-0"
                        defaultValue=""
                        onChange={async (e) => {
                          const tableId = e.target.value || null
                          await supabase.from('guests').update({ table_id: tableId }).eq('id', g.id)
                          setUnassigned(prev => prev.filter(x => x.id !== g.id))
                          if (tableId) setTables(prev => prev.map(t => t.id === tableId ? { ...t, guests: [...t.guests, { ...g, table_id: tableId }] } : t))
                        }}
                      >
                        <option value="">Asignează...</option>
                        {tables.map(t => {
                          const occ = t.guests.reduce((s, x) => s + 1 + (x.has_plus_one ? 1 : 0), 0)
                          return <option key={t.id} value={t.id} disabled={occ >= t.capacity}>{t.name} ({occ}/{t.capacity})</option>
                        })}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {tables.map((table) => {
          const occ = table.guests.reduce((s, g) => s + 1 + (g.has_plus_one ? 1 : 0), 0)
          return (
            <div key={table.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">{table.name}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${occ >= table.capacity ? 'bg-red-50 text-red-500' : 'bg-stone-100 text-gray-500'}`}>
                  {occ}/{table.capacity} locuri
                </span>
              </div>
              {table.guests.length === 0 ? (
                <p className="text-xs text-gray-400">Niciun invitat asignat</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {table.guests.map((g) => {
                    const catCfg = CATEGORY_LABELS[g.category]
                    return (
                      <span key={g.id} className={`text-xs rounded-full px-2.5 py-1 border font-medium ${catCfg?.color ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {g.name}{g.has_plus_one ? ` +1` : ''}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {tables.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-stone-300 p-10 text-center">
            <p className="text-gray-400 text-sm">Nicio masă adăugată încă.</p>
          </div>
        )}
        <p className="text-xs text-center text-gray-400 pb-2">
          Drag & drop disponibil pe desktop. Pe mobil poți asigna invitații la mese din lista de sus.
        </p>
      </div>

      {/* Desktop canvas — drag & drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="hidden md:flex gap-3 flex-1 min-h-0">
          {/* Unassigned panel */}
          <div className="w-56 flex-shrink-0 overflow-y-auto">
            <DroppableTable
              id="unassigned" title="Neasignați"
              guests={unassigned} capacity={999}
              shape="rectangular" canEdit={canEdit} isUnassigned
            />
          </div>

          {/* Canvas */}
          <div ref={canvasContainerRef} className="flex-1 overflow-auto rounded-2xl border border-amber-200 shadow-inner" style={{ backgroundColor: '#e8d5b0' }}>
            {/* Size proxy: gives the scroll container the correct scaled dimensions */}
            <div style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom, position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                position: 'absolute', top: 0, left: 0,
                width: CANVAS_W, height: CANVAS_H,
                transformOrigin: 'top left',
                transform: `scale(${zoom})`,
                backgroundColor: '#f2e4cc',
                backgroundImage: FLOOR_BG,
                backgroundSize: '80px 80px',
                boxShadow: 'inset 0 0 120px rgba(100,65,20,0.08)',
              }}
            >
              {/* Hall walls outline */}
              <div style={{
                position: 'absolute',
                top: 48, left: 48,
                width: CANVAS_W - 96, height: CANVAS_H - 96,
                border: '6px solid rgba(130,90,40,0.18)',
                borderRadius: 8,
                pointerEvents: 'none',
                zIndex: 1,
                boxShadow: [
                  'inset 0 0 0 3px rgba(130,90,40,0.09)',
                  '0 0 0 48px rgba(100,65,20,0.04)',
                ].join(', '),
              }} />

              {/* Venue elements */}
              {venueElements.map(el => {
                const def = ELEMENT_DEFS[el.type] ?? { label: el.label ?? el.type, emoji: '📍', bg: '#f8fafc', border: '#cbd5e1' }
                const isDragging = draggingId === el.id
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute', left: el.position_x, top: el.position_y,
                      width: el.width, height: el.height, zIndex: isDragging ? 50 : 15,
                    }}
                  >
                    {canEdit && (
                      <div
                        className="absolute top-0 left-0 right-0 h-5 flex items-center justify-center cursor-move rounded-t-xl text-slate-400 hover:text-slate-700 text-[11px] select-none z-10"
                        style={{ background: 'rgba(255,255,255,0.75)' }}
                        onMouseDown={e => startCanvasDrag(e, el.id, 'element')}
                      >
                        ⠿ ⠿ ⠿
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', inset: 0, paddingTop: canEdit ? 20 : 0,
                      border: `2px dashed ${isDragging ? '#6366f1' : def.border}`,
                      borderRadius: 12,
                      backgroundColor: def.bg,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, userSelect: 'none',
                      boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.18)' : '0 2px 6px rgba(0,0,0,0.07)',
                    }}>
                      <span style={{ fontSize: el.height > 80 ? 32 : 22 }}>{def.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', textAlign: 'center', lineHeight: 1.2 }}>
                        {el.label ?? def.label}
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteElement(el.id)}
                        className="absolute top-0.5 right-0.5 z-20 w-4 h-4 rounded-full bg-white border border-stone-300 text-gray-400 hover:text-red-500 flex items-center justify-center text-[9px]"
                      >✕</button>
                    )}
                    {canEdit && (
                      <div
                        onMouseDown={e => startResizeDrag(e, el.id)}
                        className="absolute bottom-0.5 right-0.5 z-20 w-5 h-5 cursor-nwse-resize flex items-end justify-end"
                        title="Redimensionează"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M9 1L1 9M9 5L5 9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Tables */}
              {tables.map(table => {
                const pos = positions[table.id] ?? { x: 80, y: 80 }
                const isDragging = draggingId === table.id
                const hasHighlightedCat = highlightCategory ? table.guests.some(g => g.category === highlightCategory) : false
                const ringColor = highlightCategory ? CATEGORY_LABELS[highlightCategory]?.ring : undefined
                const scale = tableScales[table.id] ?? 1
                const isLocked = lockedTables.has(table.id)
                return (
                  <div
                    key={table.id}
                    style={{
                      position: 'absolute', left: pos.x, top: pos.y,
                      zIndex: isDragging ? 20 : 3,
                      filter: isDragging ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' : undefined,
                      opacity: highlightCategory && !hasHighlightedCat ? 0.3 : 1,
                      transition: 'opacity 0.2s',
                      transform: scale !== 1 ? `scale(${scale})` : undefined,
                      transformOrigin: 'top left',
                      borderRadius: 16,
                      boxShadow: highlightCategory && hasHighlightedCat ? `0 0 0 4px ${ringColor}, 0 0 20px ${ringColor}88` : undefined,
                    }}
                  >
                    {canEdit && (
                      <div
                        className={cn(
                          'flex items-center h-6 rounded-t-xl select-none text-[11px]',
                          isDragging ? 'bg-rose-100 text-rose-500' : 'text-slate-400',
                          isLocked && 'border border-amber-300',
                        )}
                        style={{ minWidth: 80, background: isDragging ? undefined : isLocked ? 'rgba(254,243,199,0.9)' : 'rgba(255,255,255,0.7)' }}
                      >
                        {isLocked ? (
                          <div className="flex-1 flex items-center justify-center gap-1 text-amber-500 text-[10px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M17 11V7A5 5 0 0 0 7 7v4H5v11h14V11h-2zm-6 6.7V16a1 1 0 0 1 2 0v1.7a1 1 0 1 1-2 0zM15 11H9V7a3 3 0 0 1 6 0v4z"/></svg>
                            blocat
                          </div>
                        ) : (
                          <div
                            className="flex-1 flex items-center justify-center cursor-move hover:text-slate-700"
                            onMouseDown={e => startCanvasDrag(e, table.id, 'table')}
                            title="Trage pentru a muta masa"
                          >
                            ⠿ ⠿ ⠿
                          </div>
                        )}
                        <button
                          onClick={() => adjustScale(table.id, -0.1)}
                          className="px-1 h-full flex items-center hover:text-gray-800 transition-colors font-bold text-[13px] leading-none"
                          title="Micșorează masa"
                        >−</button>
                        <button
                          onClick={() => adjustScale(table.id, 0.1)}
                          className="px-1 h-full flex items-center hover:text-gray-800 transition-colors font-bold text-[13px] leading-none"
                          title="Mărește masa"
                        >+</button>
                        <button
                          onClick={() => toggleLock(table.id)}
                          className={`px-1 h-full flex items-center transition-colors ${isLocked ? 'text-amber-500 hover:text-amber-700' : 'hover:text-slate-700'}`}
                          title={isLocked ? 'Deblochează masa' : 'Blochează masa (finalizat)'}
                        >
                          {isLocked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M17 11V7A5 5 0 0 0 7 7v4H5v11h14V11h-2zm-6 6.7V16a1 1 0 0 1 2 0v1.7a1 1 0 1 1-2 0zM15 11H9V7a3 3 0 0 1 6 0v4z"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                          )}
                        </button>
                        <button
                          onClick={() => openEditTable(table)}
                          className="px-1.5 h-full flex items-center hover:text-gray-800 transition-colors"
                          title="Editează masa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    )}
                    <DroppableTable
                      id={table.id}
                      title={table.name}
                      guests={table.guests}
                      capacity={table.capacity}
                      shape={table.shape}
                      canEdit={canEdit && !isLocked}
                      onDelete={canEdit && !isLocked ? () => handleDeleteTable(table.id) : undefined}
                    />
                  </div>
                )
              })}

              {tables.length === 0 && venueElements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-white/90 rounded-2xl p-10 border-2 border-dashed border-stone-300 shadow-sm">
                    <div className="text-5xl mb-3">💍</div>
                    <p className="font-[family-name:var(--font-playfair)] font-semibold text-gray-700">Planșa sălii este goală</p>
                    <p className="text-sm text-stone-400 mt-1">Adaugă mese și elemente din bara de sus.</p>
                  </div>
                </div>
              )}
            </div>
            </div>
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


      {/* Edit table dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Editează masa</DialogTitle></DialogHeader>
          <form onSubmit={handleEditTable} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Numele mesei *</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Masa 1 / Familia miresei" required />
            </div>
            <div className="space-y-1">
              <Label>Locuri</Label>
              <Input type="number" min={1} max={30} value={editCapacity} onChange={e => setEditCapacity(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={loading || !editName}>
              {loading ? 'Se salvează...' : 'Salvează'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create table dialog */}
      <Dialog open={createOpen} onOpenChange={open => { setCreateOpen(open); if (!open) { setNewTableName(''); setNewTableCapacity('8'); setNewTableShape('round') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Masă nouă</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTable} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Numele mesei *</Label>
              <Input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Masa 1 / Familia miresei" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Locuri</Label>
                <Input type="number" min={1} max={30} value={newTableCapacity} onChange={e => setNewTableCapacity(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Formă</Label>
                <Select value={newTableShape} onValueChange={v => v && setNewTableShape(v as 'round' | 'rectangular' | 'head')}>
                  <SelectTrigger><SelectValue>
                    {newTableShape === 'round' ? 'Rotundă' : newTableShape === 'rectangular' ? 'Dreptunghiulară' : 'Masă mirilor'}
                  </SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Rotundă</SelectItem>
                    <SelectItem value="rectangular">Dreptunghiulară</SelectItem>
                    <SelectItem value="head">Masă mirilor (un rând)</SelectItem>
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

      {/* Add venue element dialog */}
      <Dialog open={addElementOpen} onOpenChange={setAddElementOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Adaugă element în sală</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">Elementele pot fi mutate liber pe planșă.</p>
          <div className="grid grid-cols-4 gap-3 mt-2">
            {Object.entries(ELEMENT_DEFS).map(([type, def]) => (
              <button
                key={type}
                onClick={() => handleAddElement(type)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-stone-200 hover:border-rose-300 hover:bg-rose-50 transition-colors"
              >
                <span style={{ fontSize: 26 }}>{def.emoji}</span>
                <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight">{def.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
