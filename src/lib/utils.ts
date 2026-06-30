import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PlanTier } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isPlanActive(tier: PlanTier, expiresAt: string | null): boolean {
  if (tier === 'free') return true
  if (!expiresAt) return false
  return new Date(expiresAt) > new Date()
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'acum'
  if (diffMins < 60) return `acum ${diffMins} min`
  if (diffHours < 24) return `acum ${diffHours}h`
  return `acum ${diffDays}z`
}

export function generateInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    family: 'Familie',
    friends: 'Prieteni',
    coworkers: 'Colegi',
    kids: 'Copii',
  }
  return labels[category] ?? category
}

export function rsvpLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'În așteptare',
    confirmed: 'Confirmat',
    declined: 'Refuzat',
  }
  return labels[status] ?? status
}

// 4 well-differentiated colors used per table, assigned by guest position
export const GUEST_PALETTE = [
  { main: '#e11d48', light: '#fecdd3', text: '#9f1239' },  // rose
  { main: '#1d4ed8', light: '#dbeafe', text: '#1e3a8a' },  // blue
  { main: '#16a34a', light: '#dcfce7', text: '#14532d' },  // green
  { main: '#d97706', light: '#fef3c7', text: '#92400e' },  // amber
]

export function guestColorIndex(guestId: string): number {
  let hash = 0
  for (const ch of guestId) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff
  return hash % GUEST_PALETTE.length
}
