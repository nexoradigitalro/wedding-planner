import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  { icon: '👥', title: 'Gestionare invitați', desc: 'Adaugă, importă din Excel, categorizează și urmărește confirmările în timp real.' },
  { icon: '🪑', title: 'Plan mese drag & drop', desc: 'Trage invitații la mese direct de pe telefon. Simplu, rapid, vizual.' },
  { icon: '⚡', title: 'Colaborare în timp real', desc: 'Tu și partenerul editați același eveniment simultan. Fiecare schimbare apare instant.' },
  { icon: '📩', title: 'RSVP online', desc: 'Link public de confirmare cu preferințe meniu și mesaj personal.' },
  { icon: '📱', title: 'QR check-in', desc: 'La intrare, scanezi QR-ul și invitatul vede instant masa lui.' },
  { icon: '📄', title: 'Export PDF & CSV', desc: 'Plan de mese gata de printat sau trimis la salon în câteva secunde.' },
]

const pricing = [
  {
    name: 'Gratuit', price: '0', desc: 'Perfect pentru a testa',
    features: ['1 eveniment', '75 invitați', '10 mese', 'Link RSVP', 'Export CSV'],
    cta: 'Începe gratuit', href: '/register', highlighted: false,
  },
  {
    name: 'Basic', price: '49', desc: 'Pentru nunta perfectă',
    features: ['1 eveniment', 'Invitați nelimitați', 'Mese nelimitate', 'Export PDF', '1 colaborator'],
    cta: 'Alege Basic', href: '/register?plan=basic', highlighted: false,
  },
  {
    name: 'Pro', price: '79', desc: 'Colaborare completă',
    features: ['Evenimente nelimitate', 'Invitați nelimitați', 'Colaboratori nelimitați', 'Feed activitate live', 'QR check-in', 'Export PDF & CSV'],
    cta: 'Alege Pro', href: '/register?plan=pro', highlighted: true,
  },
]

const steps = [
  { step: '1', title: 'Creează contul', desc: 'Google sau email. Zero formulare.' },
  { step: '2', title: 'Adaugă invitații', desc: 'Manual sau import din Excel.' },
  { step: '3', title: 'Aranjează mesele', desc: 'Drag & drop, gata în minute.' },
  { step: '4', title: 'Invită partenerul', desc: 'Link de colaborare, editare simultană.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-rose-600">💍 Wedding Planner</span>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Intră în cont</Button></Link>
            <Link href="/register"><Button size="sm" className="bg-rose-600 hover:bg-rose-700">Începe gratuit</Button></Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-white pt-20 pb-28 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">
            Cel mai simplu plan de mese din România 🇷🇴
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900">
            Organizează nunta <span className="text-rose-600">împreună</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Invitați, mese, RSVP și check-in QR — totul într-un singur loc.
            Tu și partenerul editați în timp real, de pe orice dispozitiv.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-base px-8">
                Începe gratuit — fără card
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                Vezi prețurile
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-400">Gratis pentru nunți cu până la 75 invitați · Fără abonament automat</p>
        </div>
      </section>

      <div className="bg-rose-600 text-white py-3 px-4 text-center text-sm font-medium">
        ✨ Mai ieftin decât concurența · Colaborare în timp real · Mobile-first
      </div>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Gata în 4 pași simpli</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 font-bold text-xl flex items-center justify-center mx-auto">{s.step}</div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Tot ce ai nevoie</h2>
          <p className="text-center text-gray-500 mb-12">Fără funcții inutile. Doar ce contează.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-2">
                  <div className="text-3xl">{f.icon}</div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-rose-600 to-pink-600 text-white">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="text-5xl">⚡</div>
          <h2 className="text-3xl sm:text-4xl font-bold">Editați împreună, în timp real</h2>
          <p className="text-lg text-rose-100 max-w-xl mx-auto">
            Tu muți un invitat la masă. Partenerul tău vede schimbarea instant — fără refresh, fără confuzie.
          </p>
          <div className="bg-white/10 rounded-xl p-4 text-left max-w-sm mx-auto font-mono text-sm">
            <p className="text-rose-200 text-xs mb-2">Feed activitate live</p>
            <p>👤 Ana a mutat <strong>Ionescu Maria</strong> la Masa 4</p>
            <p className="text-rose-200 mt-1">acum 2 min</p>
            <p className="mt-2">👤 Mihai a adăugat <strong>Popescu Dan</strong></p>
            <p className="text-rose-200 mt-1">acum 5 min</p>
          </div>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="mt-4">Încearcă gratuit</Button>
          </Link>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Prețuri simple și corecte</h2>
          <p className="text-center text-gray-500 mb-2">Plătești o singură dată. Valabil 12 luni. Fără reînnoire automată.</p>
          <p className="text-center text-sm text-gray-400 mb-12">Cu ~50% mai ieftin față de alte soluții din România</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {pricing.map((p) => (
              <Card key={p.name} className={`relative border-2 ${p.highlighted ? 'border-rose-500 shadow-xl' : 'border-gray-100'}`}>
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-rose-600 text-white hover:bg-rose-600">Cel mai popular</Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.desc}</p>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    <span className="text-gray-500 mb-1">RON</span>
                  </div>
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className="text-green-500">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link href={p.href} className="block">
                    <Button className={`w-full ${p.highlighted ? 'bg-rose-600 hover:bg-rose-700' : ''}`} variant={p.highlighted ? 'default' : 'outline'}>
                      {p.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-10 px-4 text-center text-sm text-gray-400">
        <p className="font-medium text-gray-600 mb-1">💍 Wedding Planner by Nexora Digital</p>
        <p>Cel mai simplu și modern organizator de nuntă din România</p>
        <div className="flex justify-center gap-4 mt-4">
          <Link href="/login" className="hover:text-gray-600">Intră în cont</Link>
          <Link href="/register" className="hover:text-gray-600">Înregistrare</Link>
        </div>
      </footer>
    </div>
  )
}
