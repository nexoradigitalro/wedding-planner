'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const plans = [
  {
    key: 'basic' as const,
    name: 'Basic',
    price: '79',
    desc: 'Tot ce ai nevoie pentru nunta ta',
    features: [
      '1 eveniment, până la 230 invitați',
      'Mese nelimitate',
      'Link RSVP public',
      'Import & Export CSV',
      'Statistici porții & mărturii',
      'Plan mese vizual (drag & drop)',
      '2 colaboratori (partener + naș)',
      'Feed activitate în timp real',
    ],
    highlighted: false,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '109',
    desc: 'Pentru organizatori și planners',
    features: [
      'Evenimente nelimitate',
      'Invitați nelimitați',
      'Mese nelimitate',
      'Link RSVP public',
      'Import & Export CSV',
      'Statistici porții & mărturii',
      'Plan mese vizual (drag & drop)',
      'Export PDF plan mese',
      'Colaboratori nelimitați',
      'Feed activitate în timp real',
      'Wedding Planner To-Do',
      'Suport prioritar',
    ],
    highlighted: true,
  },
]

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const autostart = new URLSearchParams(window.location.search).get('autostart')
    if (autostart === 'basic' || autostart === 'pro') {
      window.history.replaceState({}, '', '/upgrade')
      handleUpgrade(autostart)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade(plan: 'basic' | 'pro' | 'test') {
    setLoading(plan)
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        toast.error('Eroare la procesarea plății. Încearcă din nou.')
        setLoading(null)
        return
      }
      const { url } = await res.json()
      if (url) {
        window.location.replace(url)
      } else {
        toast.error('Nu s-a putut genera linkul de plată.')
        setLoading(null)
      }
    } catch {
      toast.error('Eroare de rețea. Verifică conexiunea și încearcă din nou.')
      setLoading(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Alege planul tău</h1>
        <p className="text-muted-foreground mt-2">
          Plătești o singură dată · Valabil 12 luni · Fără reînnoire automată
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
        {plans.map((p) => (
          <Card key={p.key} className={`relative border-2 overflow-visible ${p.highlighted ? 'border-rose-500 shadow-xl' : 'border-gray-100'}`}>
            {p.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-rose-600 text-white hover:bg-rose-600 shadow-md">Cel mai popular</Badge>
              </div>
            )}
            <CardContent className="pt-8 pb-6 space-y-4">
              <div>
                <h3 className="font-bold text-xl">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-extrabold">{p.price}</span>
                <span className="text-muted-foreground mb-1">RON · o singură dată</span>
              </div>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full text-base py-5 ${p.highlighted ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                variant={p.highlighted ? 'default' : 'outline'}
                disabled={loading === p.key}
                onClick={() => handleUpgrade(p.key)}
              >
                {loading === p.key ? 'Se redirectează...' : `Alege ${p.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          Se deschide pagina de plată Stripe...
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Plată securizată prin Stripe · Revolut Pay acceptat · Nu stocăm datele cardului
      </p>

      {/* Buton test temporar — de șters după verificare */}
      <div className="text-center pt-4 border-t border-dashed border-stone-200">
        <p className="text-xs text-gray-400 mb-2">Test plată (intern)</p>
        <Button variant="outline" size="sm" onClick={() => handleUpgrade('test')} disabled={loading}>
          Plătește 5 RON test
        </Button>
      </div>
    </div>
  )
}
