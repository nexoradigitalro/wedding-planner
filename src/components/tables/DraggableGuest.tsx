'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { Guest } from '@/types'

interface Props {
  guest: Guest
  canEdit: boolean
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  family:    { bg: '#f3e8ff', text: '#7c3aed' },
  friends:   { bg: '#dbeafe', text: '#1d4ed8' },
  coworkers: { bg: '#ffedd5', text: '#c2410c' },
  kids:      { bg: '#fce7f3', text: '#be185d' },
}

const RSVP_RING: Record<string, string> = {
  confirmed: '#22c55e',
  pending:   '#eab308',
  declined:  '#ef4444',
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function DraggableGuest({ guest, canEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
    disabled: !canEdit,
  })

  const color = CATEGORY_COLORS[guest.category] ?? CATEGORY_COLORS.friends
  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined

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
        width: 28, height: 28, borderRadius: '50%',
        backgroundColor: color.bg, color: color.text,
        fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${RSVP_RING[guest.rsvp_status]}`,
        flexShrink: 0,
      }}>
        {getInitials(guest.name)}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-gray-800 truncate text-xs">{guest.name}</p>
        {(guest.companions_count ?? (guest.has_plus_one ? 1 : 0)) > 0 && (
          <p className="text-gray-400 text-[10px] truncate">+{guest.companions_count ?? 1} {guest.companions_count === 1 && guest.plus_one_name ? guest.plus_one_name : 'însoțitor(i)'}</p>
        )}
      </div>
    </div>
  )
}
