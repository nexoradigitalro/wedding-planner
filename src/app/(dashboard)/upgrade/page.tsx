'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const plans = [
  {
    key: 'basic' as const,
    name: 'Basic',
    price: '49',
    desc: 'Pentru nunta perfectă',
    features: ['1 eveniment', 'Invitați nelimitați', 'Mese nelimitate', 'Export PDF', '1 colaborator'],
    highlighted: false,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '79',
    desc: 'Colaborare completă',
    features: ['Evenimente nelimitate', 'Invitați nelimitați', 'Colaboratori nelimitați', 'Feed activitate live', 'QR check-in', 'Export PDF & CSV'],
    highlighted: true,
  },
]

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(plan: 'basic' | 'pro') {
    setLoading(plan)
    const res = await fetch('/api/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Alege planul tău</h1>
        <p className="text-muted-foreground mt-2">
          Plătești o singură dată · Valabil 12 luni · Fără reînnoire automată
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {plans.map((p) => (
          <Card key={p.key} className={`relative border-2 ${p.highlighted ? 'border-rose-500 shadow-xl' : 'border-gray-100'}`}>
            {p.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-rose-600 text-white hover:bg-rose-600">Cel mai popular</Badge>
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
                disabled={loading !== null}
                onClick={() => handleUpgrade(p.key)}
              >
                {loading === p.key ? 'Se redirectează...' : `Alege ${p.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Plată securizată prin Stripe · Revolut Pay acceptat · Nu stocăm datele cardului
      </p>
    </div>
  )
}
