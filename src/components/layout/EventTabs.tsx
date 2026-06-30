'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  eventId: string
  role: string
  planTier: string
}

export default function EventTabs({ eventId, role, planTier }: Props) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Invitați', href: `/events/${eventId}/guests` },
    { label: 'Mese', href: `/events/${eventId}/tables` },
    { label: 'RSVP', href: `/events/${eventId}/rsvp` },
    { label: 'Colaborare', href: `/events/${eventId}/collaborate` },
    { label: 'Wedding Planner To-Do', href: `/events/${eventId}/todos` },
    { label: '💰 Costuri', href: `/events/${eventId}/costuri` },
    { label: '🎁 Cinste', href: `/events/${eventId}/cinste` },
    { label: '📋 Program Zi', href: `/events/${eventId}/program` },
    ...(role === 'owner' ? [{ label: 'Setări', href: `/events/${eventId}/settings` }] : []),
  ]

  return (
    <nav className="flex gap-0 border-b border-stone-200 overflow-x-auto scrollbar-none -mx-4 sm:mx-0 px-4 sm:px-0">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'shrink-0 px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            pathname === tab.href
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-stone-300'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
