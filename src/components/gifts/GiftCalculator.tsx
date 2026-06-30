'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Guest } from '@/types'

interface Props {
  eventId: string
  initialGuests: Guest[]
}

type GuestRow = Guest & { _saving?: boolean }

export default function GiftCalculator({ eventId, initialGuests }: Props) {
  const confirmed = initialGuests.filter((g) => g.rsvp_status === 'confirmed')
  const [guests, setGuests] = useState<GuestRow[]>(confirmed)
  const supabase = createClient()
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const present = guests.filter((g) => g.attended === true)
  const absent = guests.filter((g) => g.attended === false)
  const unmarked = guests.filter((g) => g.attended === null || g.attended === undefined)
  const totalCollected = guests.reduce((s, g) => s + (g.gift_amount ?? 0), 0)
  const withGift = guests.filter((g) => (g.gift_amount ?? 0) > 0)
  const avgGift = withGift.length > 0 ? Math.round(totalCollected / withGift.length) : 0
  const totalPersons = present.reduce((s, g) => s + 1 + (g.companions_count ?? (g.has_plus_one ? 1 : 0)), 0)

  async function setAttended(guest: GuestRow, val: boolean | null) {
    setGuests((prev) => prev.map((g) => g.id === guest.id ? { ...g, attended: val } : g))
    await supabase.from('guests').update({ attended: val }).eq('id', guest.id)
    if (val === true) {
      setTimeout(() => inputRefs.current[guest.id]?.focus(), 50)
    }
  }

  async function setGift(guestId: string, amount: number | null) {
    setGuests((prev) => prev.map((g) => g.id === guestId ? { ...g, gift_amount: amount } : g))
  }

  async function saveGift(guestId: string, amount: number | null) {
    const { error } = await supabase.from('guests').update({ gift_amount: amount }).eq('id', guestId)
    if (error) toast.error('Eroare la salvare')
  }

  if (confirmed.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-300 py-16 text-center">
        <p className="text-3xl mb-3">🎁</p>
        <p className="font-medium text-gray-700">Niciun invitat confirmat</p>
        <p className="text-sm text-gray-400 mt-1">Marcați invitații ca "Confirmat" în lista de invitați pentru a-i vedea aici.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalCollected.toLocaleString('ro-RO')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total colectat (RON)</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{present.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Prezenți ({totalPersons} pers.)</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-400">{absent.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Absenți</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-rose-600">{avgGift.toLocaleString('ro-RO')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Medie per invitație</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {guests.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{guests.length - unmarked.length} din {guests.length} marcați</span>
            <span className="font-medium text-gray-700">{Math.round(((guests.length - unmarked.length) / guests.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all"
              style={{ width: `${((guests.length - unmarked.length) / guests.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Guest table */}
      <div className="rounded-xl border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invitat</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Prezență</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cinste (RON)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {guests.map((guest) => (
              <tr key={guest.id} className={cn('transition-colors', guest.attended === false && 'opacity-50 bg-gray-50')}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{guest.name}</p>
                  {(guest.companions_count ?? (guest.has_plus_one ? 1 : 0)) > 0 && (
                    <p className="text-xs text-muted-foreground">+{guest.companions_count ?? 1} {guest.companions_count === 1 && guest.plus_one_name ? guest.plus_one_name : 'însoțitor(i)'}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setAttended(guest, guest.attended === true ? null : true)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                        guest.attended === true
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-400 border-stone-200 hover:border-green-300 hover:text-green-600'
                      )}
                    >
                      Prezent
                    </button>
                    <button
                      onClick={() => setAttended(guest, guest.attended === false ? null : false)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                        guest.attended === false
                          ? 'bg-red-400 text-white border-red-400'
                          : 'bg-white text-gray-400 border-stone-200 hover:border-red-300 hover:text-red-500'
                      )}
                    >
                      Absent
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    {guest.attended !== null && guest.attended !== undefined ? (
                      <div className="relative">
                        <input
                          ref={(el) => { inputRefs.current[guest.id] = el }}
                          type="number"
                          min={0}
                          step={50}
                          placeholder="0"
                          value={guest.gift_amount ?? ''}
                          onChange={(e) => setGift(guest.id, e.target.value ? parseInt(e.target.value) : null)}
                          onBlur={(e) => saveGift(guest.id, e.target.value ? parseInt(e.target.value) : null)}
                          className="w-28 h-9 rounded-lg border border-stone-200 bg-white px-3 pr-10 text-sm text-right outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">RON</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs pr-2">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom summary */}
      {present.length > 0 && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">
              Total colectat: <span className="text-rose-600">{totalCollected.toLocaleString('ro-RO')} RON</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {withGift.length} invitați au dat cinste · medie {avgGift.toLocaleString('ro-RO')} RON/invitație
            </p>
          </div>
          {unmarked.length > 0 && (
            <p className="text-xs text-amber-600 font-medium shrink-0">
              ⚠ {unmarked.length} invitați nemarcați
            </p>
          )}
        </div>
      )}
    </div>
  )
}
