'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  eventId: string
  role: string
}

export default function EventTabs({ eventId, role }: Props) {
  const pathname = usePathname()

  const tabs = [
    { label: '👥 Invitați', href: `/events/${eventId}/guests` },
    { label: '🪑 Mese', href: `/events/${eventId}/tables` },
    { label: '📩 RSVP', href: `/events/${eventId}/rsvp` },
    { label: '⚡ Colaborare', href: `/events/${eventId}/collaborate` },
    ...(role === 'owner' ? [{ label: '⚙ Setări', href: `/events/${eventId}/settings` }] : []),
  ]

  return (
    <nav className="flex gap-1 border-b overflow-x-auto pb-0 -mb-px">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            pathname === tab.href
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
