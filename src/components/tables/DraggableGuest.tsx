'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { Guest } from '@/types'

interface Props {
  guest: Guest
  canEdit: boolean
}

const RSVP_DOT: Record<string, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-green-500',
  declined: 'bg-red-400',
}

export default function DraggableGuest({ guest, canEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
    disabled: !canEdit,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm bg-gray-50 border border-gray-100',
        canEdit && 'cursor-grab active:cursor-grabbing hover:bg-rose-50 hover:border-rose-200',
        isDragging && 'opacity-50'
      )}
    >
      <span className={cn('w-2 h-2 rounded-full shrink-0', RSVP_DOT[guest.rsvp_status])} />
      <span className="truncate font-medium">{guest.name}</span>
      {guest.has_plus_one && <span className="text-xs text-muted-foreground shrink-0">+1</span>}
    </div>
  )
}
