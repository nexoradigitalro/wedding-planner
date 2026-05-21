'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PublicRsvpPage() {
  const { token } = useParams<{ token: string }>()

  // Primary guest
  const [prenume, setPrenume] = useState('')
  const [nume, setNume] = useState('')

  // Attendance
  const [attending, setAttending] = useState<boolean | null>(null)

  // Companion
  const [compPrenume, setCompPrenume] = useState('')
  const [compNume, setCompNume] = useState('')

  // Details
  const [menu, setMenu] = useState('')
  const [allergies, setAllergies] = useState('')
  const [message, setMessage] = useState('')

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const hasCompanion = compPrenume.trim().length > 0 || compNume.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (attending === null) return
    setLoading(true)
    setError(null)
    const guestName = [prenume.trim(), nume.trim()].filter(Boolean).join(' ')
    const companionName = [compPrenume.trim(), compNume.trim()].filter(Boolean).join(' ') || null
    const { error: insertError } = await supabase.from('rsvp_responses').insert({
      event_id: token,
      guest_name: guestName,
      companion_name: companionName,
      attending,
      plus_one_count: companionName ? 1 : 0,
      menu_choice: menu || null,
      allergies: allergies || null,
      message: message || null,
    })
    if (insertError) {
      setError('A apărut o eroare. Te rugăm să încerci din nou.')
      setLoading(false)
      return
    }
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-0">
          <CardContent className="py-12 space-y-3">
            <div className="text-5xl">{attending ? '🎉' : '😢'}</div>
            <h2 className="text-xl font-bold">
              {attending ? 'Ne bucurăm că vii!' : 'Îți mulțumim pentru răspuns'}
            </h2>
            <p className="text-muted-foreground">
              {attending
                ? 'Confirmare primită. Ne vedem la nuntă!'
                : 'Am înregistrat răspunsul tău. Îți mulțumim că ne-ai anunțat.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">💍</div>
          <CardTitle className="text-2xl">Confirmare participare</CardTitle>
          <p className="text-muted-foreground text-sm">Te rugăm să completezi formularul de mai jos</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Primary guest name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prenume *</Label>
                <Input
                  value={prenume}
                  onChange={(e) => setPrenume(e.target.value)}
                  placeholder="Andreea"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nume *</Label>
                <Input
                  value={nume}
                  onChange={(e) => setNume(e.target.value)}
                  placeholder="Irimie"
                  required
                />
              </div>
            </div>

            {/* Attendance choice */}
            <div className="space-y-2">
              <Label>Participi la nuntă? *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttending(true)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${attending === true ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="font-medium text-sm">Da, vin!</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAttending(false)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${attending === false ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-1">😢</div>
                  <div className="font-medium text-sm">Nu pot veni</div>
                </button>
              </div>
            </div>

            {/* Companion section — only if attending */}
            {attending && (
              <>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-500">Însoțitor (opțional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">Prenume însoțitor</Label>
                      <Input
                        value={compPrenume}
                        onChange={(e) => setCompPrenume(e.target.value)}
                        placeholder="Cornel"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600">Nume însoțitor</Label>
                      <Input
                        value={compNume}
                        onChange={(e) => setCompNume(e.target.value)}
                        placeholder="Irimie"
                        className="bg-white"
                      />
                    </div>
                  </div>
                  {hasCompanion && (
                    <p className="text-xs text-green-700">
                      ✓ Veniți în 2: <strong>{[prenume, nume].filter(Boolean).join(' ')}</strong> și <strong>{[compPrenume, compNume].filter(Boolean).join(' ')}</strong>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Preferință meniu</Label>
                  <Input value={menu} onChange={(e) => setMenu(e.target.value)} placeholder="Normal / Vegetarian / Vegan / Copil" />
                </div>
                <div className="space-y-1.5">
                  <Label>Alergii sau restricții alimentare</Label>
                  <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Gluten, lactate, nuci..." />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Mesaj pentru miri (opțional)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Un gând frumos pentru ziua cea mare..." rows={3} />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700"
              disabled={loading || !prenume.trim() || attending === null}
            >
              {loading ? 'Se trimite...' : 'Trimite confirmarea'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
