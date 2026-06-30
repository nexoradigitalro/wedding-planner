'use client'

import React from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { Guest } from '@/types'

interface Props {
  id: string
  title: string
  guests: Guest[]
  capacity: number
  shape: 'round' | 'rectangular' | 'head'
  canEdit: boolean
  isUnassigned?: boolean
  onDelete?: () => void
}

const CATEGORY_FILL: Record<string, string> = {
  family:    '#7c3aed',
  friends:   '#1d4ed8',
  coworkers: '#c2410c',
  kids:      '#be185d',
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  family:    { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  friends:   { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  coworkers: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  kids:      { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },
}

const RSVP_RING: Record<string, string> = {
  confirmed: '#22c55e',
  pending:   '#eab308',
  declined:  '#ef4444',
}

type SeatEntry =
  | { kind: 'main'; guest: Guest }
  | { kind: 'plus_one'; guest: Guest; companionIndex: number }
  | { kind: 'empty' }

function buildSeats(guests: Guest[], capacity: number): SeatEntry[] {
  const filled: SeatEntry[] = []
  for (const g of guests) {
    filled.push({ kind: 'main', guest: g })
    const count = g.companions_count ?? (g.has_plus_one ? 1 : 0)
    for (let i = 0; i < count; i++) {
      filled.push({ kind: 'plus_one', guest: g, companionIndex: i })
    }
  }
  return [
    ...filled,
    ...Array.from({ length: Math.max(0, capacity - filled.length) }, () => ({ kind: 'empty' as const })),
  ]
}

function getChairColor(entry: SeatEntry): string {
  if (entry.kind === 'empty') return '#94a3b8'
  const base = CATEGORY_FILL[entry.guest.category] ?? '#475569'
  if (entry.kind === 'plus_one') {
    // lighter tint for companion
    const map: Record<string, string> = {
      family: '#a78bfa', friends: '#60a5fa', coworkers: '#fb923c', kids: '#f472b6',
    }
    return map[entry.guest.category] ?? '#94a3b8'
  }
  return base
}

// Person silhouette (top-down, "front" faces downward in SVG space)
function PersonIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 30">
      <circle cx="14" cy="9" r="7" fill={color} />
      <path d="M3 26 Q3 17 14 17 Q25 17 25 26 L23 30 L5 30 Z" fill={color} />
    </svg>
  )
}

function DraggableChair({
  entry, idx, chairSize, x, y, rotDeg, canEdit,
}: {
  entry: SeatEntry
  idx: number
  chairSize: number
  x: number
  y: number
  rotDeg: number
  canEdit: boolean
}) {
  const draggable = entry.kind === 'main'
  const dragId = draggable ? (entry as { kind: 'main'; guest: Guest }).guest.id : `__seat_${idx}`

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    disabled: !canEdit || !draggable,
  })

  const color = getChairColor(entry)
  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined

  return (
    <div style={{ position: 'absolute', left: x - chairSize / 2, top: y - chairSize / 2, width: chairSize, height: chairSize }}>
      <div style={{ width: '100%', height: '100%', transform: `rotate(${rotDeg}deg)`, transformOrigin: 'center center' }}>
        <div
          ref={draggable ? setNodeRef : undefined}
          style={{ ...dragStyle, width: '100%', height: '100%' }}
          className={cn(
            'select-none',
            draggable && canEdit && 'cursor-grab active:cursor-grabbing',
            isDragging && 'opacity-30',
          )}
          {...(draggable && canEdit ? { ...listeners, ...attributes } : {})}
        >
          <PersonIcon color={color} size={chairSize} />
        </div>
      </div>
    </div>
  )
}

function NameLabel({ x, y, name, isMain, category }: { x: number; y: number; name: string; isMain: boolean; category?: string }) {
  const col = category ? CATEGORY_COLORS[category] : null
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: 'translate(-50%, -50%)',
      fontSize: 10,
      fontWeight: isMain ? 700 : 500,
      color: col ? col.text : (isMain ? '#1e293b' : '#64748b'),
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      background: col ? col.bg : 'rgba(255,255,255,0.95)',
      borderRadius: 4,
      padding: '2px 5px',
      zIndex: 10,
      lineHeight: 1.3,
      border: `1px solid ${col ? col.border : (isMain ? '#e2e8f0' : '#cbd5e1')}`,
    }}>
      {name}
    </div>
  )
}

function TableCenter({ title, occupied, capacity, radius }: { title: string; occupied: number; capacity: number; radius: number }) {
  const fontSize = Math.max(12, Math.min(16, radius / 4.5))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 6px' }}>
      <div style={{
        border: '1.5px solid #94a3b8', borderRadius: 4,
        padding: '2px 8px', fontSize, fontWeight: 700,
        color: '#334155', backgroundColor: '#f8fafc',
        textAlign: 'center', maxWidth: radius * 1.5,
        wordBreak: 'break-word', lineHeight: 1.3,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <span style={{ fontSize: 10, color: '#f43f5e', lineHeight: 1 }}>♥</span>
        <div style={{ width: 1.5, height: 6, backgroundColor: '#94a3b8' }} />
        <div style={{ width: 10, height: 1.5, backgroundColor: '#94a3b8' }} />
      </div>
      <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>{occupied}/{capacity}</span>
    </div>
  )
}

function RoundTableVisual({ title, guests, capacity, canEdit }: { title: string; guests: Guest[]; capacity: number; canEdit: boolean }) {
  const seats = buildSeats(guests, capacity)
  const n = Math.max(seats.length, 1)
  const chairSize = 30
  const tableR = Math.max(52, Math.min(76, 16 + n * 7))
  const orbitR = tableR + chairSize * 0.5 + 6
  const nameLabelR = orbitR + chairSize * 0.5 + 12
  const containerSize = (nameLabelR + 32) * 2
  const center = containerSize / 2
  const occupied = seats.filter(s => s.kind !== 'empty').length

  return (
    <div style={{ position: 'relative', width: containerSize, height: containerSize, margin: '0 auto', overflow: 'visible' }}>
      {seats.map((entry, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const cx = center + orbitR * Math.cos(angle)
        const cy = center + orbitR * Math.sin(angle)
        const rotDeg = angle * (180 / Math.PI) + 90
        const nlx = center + nameLabelR * Math.cos(angle)
        const nly = center + nameLabelR * Math.sin(angle)
        const name = entry.kind === 'main' ? entry.guest.name
          : entry.kind === 'plus_one' ? (entry.companionIndex === 0 ? (entry.guest.plus_one_name || 'Însoțitor 1') : `Însoțitor ${entry.companionIndex + 1}`) : null
        const category = entry.kind !== 'empty' ? entry.guest.category : undefined

        return (
          <React.Fragment key={i}>
            <DraggableChair entry={entry} idx={i} chairSize={chairSize} x={cx} y={cy} rotDeg={rotDeg} canEdit={canEdit} />
            {name && <NameLabel x={nlx} y={nly} name={name} isMain={entry.kind === 'main'} category={category} />}
          </React.Fragment>
        )
      })}

      <div style={{
        position: 'absolute',
        left: center - tableR, top: center - tableR,
        width: tableR * 2, height: tableR * 2,
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        border: '3px solid #94a3b8',
        boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 5,
      }}>
        <TableCenter title={title} occupied={occupied} capacity={capacity} radius={tableR} />
      </div>
    </div>
  )
}

function RectTableVisual({ title, guests, capacity, canEdit }: { title: string; guests: Guest[]; capacity: number; canEdit: boolean }) {
  const seats = buildSeats(guests, capacity)
  const perSide = Math.ceil(seats.length / 2)
  const chairSize = 28
  const nameLabelH = 18
  const slotW = chairSize + 14
  const gap = 4
  const tableW = Math.max(150, perSide * slotW + (perSide - 1) * gap)
  const tableH = 56
  const topRowY = chairSize / 2 + nameLabelH + 2
  const tableTop = topRowY + chairSize / 2 + 8
  const bottomRowY = tableTop + tableH + 8 + chairSize / 2
  const totalH = bottomRowY + chairSize / 2 + nameLabelH + 6
  const occupied = seats.filter(s => s.kind !== 'empty').length

  const renderRow = (rowSeats: SeatEntry[], startIdx: number, rowY: number, rotDeg: number, labelYOffset: number) =>
    rowSeats.map((entry, i) => {
      const x = i * (slotW + gap) + slotW / 2
      const name = entry.kind === 'main' ? entry.guest.name
        : entry.kind === 'plus_one' ? (entry.companionIndex === 0 ? (entry.guest.plus_one_name || 'Însoțitor 1') : `Însoțitor ${entry.companionIndex + 1}`) : null
      const category = entry.kind !== 'empty' ? entry.guest.category : undefined
      return (
        <React.Fragment key={`${startIdx + i}`}>
          <DraggableChair entry={entry} idx={startIdx + i} chairSize={chairSize} x={x} y={rowY} rotDeg={rotDeg} canEdit={canEdit} />
          {name && <NameLabel x={x} y={rowY + labelYOffset} name={name} isMain={entry.kind === 'main'} category={category} />}
        </React.Fragment>
      )
    })

  return (
    <div style={{ position: 'relative', width: tableW, height: totalH, margin: '0 auto', overflow: 'visible' }}>
      {renderRow(seats.slice(0, perSide), 0, topRowY, 0, -(chairSize / 2 + nameLabelH / 2 + 1))}

      <div style={{
        position: 'absolute', left: 0, top: tableTop,
        width: tableW, height: tableH,
        backgroundColor: '#ffffff',
        border: '3px solid #94a3b8',
        borderRadius: 10,
        boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '1.5px solid #94a3b8', borderRadius: 4,
            padding: '2px 8px', fontSize: 10, fontWeight: 700,
            color: '#334155', backgroundColor: '#f8fafc', display: 'inline-block',
          }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3 }}>
            <span style={{ fontSize: 9, color: '#f43f5e' }}>♥</span>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>{occupied}/{capacity}</span>
          </div>
        </div>
      </div>

      {renderRow(seats.slice(perSide), perSide, bottomRowY, 180, chairSize / 2 + nameLabelH / 2 + 1)}
    </div>
  )
}

// Head table: single row facing outward.
// Layout (top → bottom): table rectangle → chairs (rotDeg=0, natural) → name labels.
function HeadTableVisual({ title, guests, capacity, canEdit }: { title: string; guests: Guest[]; capacity: number; canEdit: boolean }) {
  const seats = buildSeats(guests, capacity)
  const n = seats.length
  const chairSize = 30
  const nameLabelH = 18
  const slotW = chairSize + 14
  const gap = 6
  const tableW = Math.max(180, n * slotW + (n - 1) * gap + 24)
  const tableH = 52
  // Table at top, chairs below facing down (toward audience), names below chairs
  const tableTop = 0
  const chairRowY = tableH + 10 + chairSize / 2
  const totalH = chairRowY + chairSize / 2 + nameLabelH + 6

  const occupied = seats.filter(s => s.kind !== 'empty').length

  return (
    <div style={{ position: 'relative', width: tableW, height: totalH, margin: '0 auto', overflow: 'visible' }}>
      {/* Table — amber tint */}
      <div style={{
        position: 'absolute', left: 0, top: tableTop,
        width: tableW, height: tableH,
        backgroundColor: '#fffbeb', border: '3px solid #f59e0b',
        borderRadius: 10, boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, zIndex: 5,
      }}>
        <div style={{
          border: '1.5px solid #f59e0b', borderRadius: 4,
          padding: '2px 10px', fontSize: 11, fontWeight: 800,
          color: '#92400e', backgroundColor: '#fffbeb',
        }}>
          {title}
        </div>
        <span style={{ fontSize: 8, color: '#b45309', fontWeight: 600 }}>
          {occupied}/{capacity} locuri
        </span>
      </div>

      {/* Single row of chairs below table, rotDeg=0 = natural upright, facing downward (toward audience) */}
      {seats.map((entry, i) => {
        const x = 12 + i * (slotW + gap) + slotW / 2
        const name = entry.kind === 'main' ? entry.guest.name
          : entry.kind === 'plus_one' ? (entry.companionIndex === 0 ? (entry.guest.plus_one_name || 'Însoțitor 1') : `Însoțitor ${entry.companionIndex + 1}`) : null
        const category = entry.kind !== 'empty' ? entry.guest.category : undefined
        return (
          <React.Fragment key={i}>
            <DraggableChair
              entry={entry} idx={i}
              chairSize={chairSize} x={x} y={chairRowY}
              rotDeg={0}
              canEdit={canEdit}
            />
            {name && (
              <NameLabel
                x={x}
                y={chairRowY + chairSize / 2 + nameLabelH / 2 + 2}
                name={name}
                isMain={entry.kind === 'main'}
                category={category}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function DraggableGuestRow({ guest, canEdit }: { guest: Guest; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id, disabled: !canEdit,
  })
  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined
  const color = CATEGORY_COLORS[guest.category] ?? CATEGORY_COLORS.friends

  return (
    <div
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={cn(
        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm border transition-colors select-none',
        canEdit && 'cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-40' : 'bg-white border-stone-200 hover:border-rose-300 hover:bg-rose-50'
      )}
    >
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        backgroundColor: color.bg, color: color.text,
        fontSize: 10, fontWeight: 700, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${RSVP_RING[guest.rsvp_status] ?? '#d1d5db'}`,
      }}>
        {guest.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-gray-800 truncate text-xs leading-tight">{guest.name}</p>
        {(guest.companions_count ?? (guest.has_plus_one ? 1 : 0)) > 0 && (
          <p className="text-gray-400 text-[10px] truncate leading-tight">
            +{guest.companions_count ?? 1} {guest.companions_count === 1 && guest.plus_one_name ? guest.plus_one_name : 'însoțitor(i)'}
          </p>
        )}
      </div>
      {(guest.companions_count ?? (guest.has_plus_one ? 1 : 0)) > 0 && (
        <span className="text-[10px] text-rose-400 font-semibold shrink-0">×{1 + (guest.companions_count ?? 1)}</span>
      )}
    </div>
  )
}

export default function DroppableTable({ id, title, guests, capacity, shape, canEdit, isUnassigned, onDelete }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id })

  const occupiedSeats = guests.reduce((s, g) => s + 1 + (g.companions_count ?? (g.has_plus_one ? 1 : 0)), 0)
  const isFull = !isUnassigned && occupiedSeats >= capacity

  if (isUnassigned) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          'rounded-2xl border-2 border-dashed p-3 min-h-40 transition-colors',
          isOver ? 'border-rose-400 bg-rose-50' : 'border-stone-300 bg-stone-50'
        )}
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
          Neasignați ({guests.length})
        </p>
        <div className="space-y-1">
          {guests.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Toți invitații sunt asignați 🎉</p>
          )}
          {guests.map((g) => <DraggableGuestRow key={g.id} guest={g} canEdit={canEdit} />)}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-all overflow-visible rounded-xl p-4',
        isOver && !isFull && 'ring-2 ring-rose-400 ring-offset-2 bg-rose-50/40',
        isOver && isFull && 'ring-2 ring-red-400 ring-offset-2 bg-red-50/40',
      )}
    >
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-white border border-stone-300 text-gray-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center text-[10px] leading-none shadow-sm"
          title="Șterge masa"
        >
          ✕
        </button>
      )}

      {shape === 'round' && <RoundTableVisual title={title} guests={guests} capacity={capacity} canEdit={canEdit} />}
      {shape === 'rectangular' && <RectTableVisual title={title} guests={guests} capacity={capacity} canEdit={canEdit} />}
      {shape === 'head' && <HeadTableVisual title={title} guests={guests} capacity={capacity} canEdit={canEdit} />}

      {isOver && !isFull && (
        <p className="text-xs text-rose-500 text-center mt-2 font-medium animate-pulse">Eliberează pentru a plasa</p>
      )}
      {isOver && isFull && (
        <p className="text-xs text-red-500 text-center mt-2 font-medium">Masă plină!</p>
      )}
    </div>
  )
}
