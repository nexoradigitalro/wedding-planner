'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn, GUEST_PALETTE, guestColorIndex } from '@/lib/utils'
import type { Guest } from '@/types'

interface Props {
  guest: Guest
  canEdit: boolean
}

export default function DraggableGuest({ guest, canEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
    disabled: !canEdit,
  })

  const palette = GUEST_PALETTE[guestColorIndex(guest.id) % GUEST_PALETTE.length]
  const companionCount = guest.companions?.length ?? guest.companions_count ?? (guest.has_plus_one ? 1 : 0)
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
        backgroundColor: palette.light, color: palette.text,
        fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2.5px solid ${palette.main}`,
        flexShrink: 0,
      }}>
        {guest.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-gray-800 truncate text-xs">{guest.name}</p>
        {companionCount > 0 && (
          <p className="text-gray-400 text-[10px] truncate">
            +{companionCount} însoțitor{companionCount > 1 ? 'i' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
