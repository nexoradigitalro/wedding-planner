'use client'

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
  const [name, setName] = useState('')
  const [attending, setAttending] = useState<boolean | null>(null)
  const [plusOne, setPlusOne] = useState('0')
  const [menu, setMenu] = useState('')
  const [allergies, setAllergies] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (attending === null) return
    setLoading(true)
    await supabase.from('rsvp_responses').insert({
      event_id: token,
      guest_name: name,
      attending,
      plus_one_count: parseInt(plusOne),
      menu_choice: menu || null,
      allergies: allergies || null,
      message: message || null,
    })
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Numele tău *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ion și Maria Popescu" required />
            </div>

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

            {attending && (
              <>
                <div className="space-y-1">
                  <Label>Număr însoțitori (inclusiv copii)</Label>
                  <Input type="number" min="0" max="10" value={plusOne} onChange={(e) => setPlusOne(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Preferință meniu</Label>
                  <Input value={menu} onChange={(e) => setMenu(e.target.value)} placeholder="Normal / Vegetarian / Vegan / Copil" />
                </div>
                <div className="space-y-1">
                  <Label>Alergii sau restricții alimentare</Label>
                  <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Gluten, lactate, nuci..." />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label>Mesaj pentru miri (opțional)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Un gând frumos pentru ziua cea mare..." rows={3} />
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700"
              disabled={loading || !name || attending === null}
            >
              {loading ? 'Se trimite...' : 'Trimite confirmarea'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
