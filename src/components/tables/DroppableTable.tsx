'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import DraggableGuest from './DraggableGuest'
import { Button } from '@/components/ui/button'
import type { Guest } from '@/types'

interface Props {
  id: string
  title: string
  guests: Guest[]
  capacity: number
  shape: 'round' | 'rectangular'
  canEdit: boolean
  isUnassigned?: boolean
  onDelete?: () => void
}

export default function DroppableTable({ id, title, guests, capacity, shape, canEdit, isUnassigned, onDelete }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const isFull = !isUnassigned && guests.length >= capacity

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-2 rounded-xl p-3 min-h-[120px] transition-colors',
        isOver ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white',
        isFull && 'opacity-70',
        isUnassigned && 'bg-gray-50 border-dashed'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {!isUnassigned && (
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', isFull ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>
              {guests.length}/{capacity}
            </span>
          )}
          {isUnassigned && guests.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
              {guests.length}
            </span>
          )}
        </div>
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
            ✕
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {guests.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isUnassigned ? 'Toți invitații sunt asignați 🎉' : 'Trage invitați aici'}
          </p>
        )}
        {guests.map((guest) => (
          <DraggableGuest key={guest.id} guest={guest} canEdit={canEdit} />
        ))}
      </div>
    </div>
  )
}
