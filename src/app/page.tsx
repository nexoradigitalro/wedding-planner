import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">

      {/* ── NAV ── */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <span className="text-white font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-wide">
            Nunta <span className="italic font-normal">Mea</span>
          </span>
          <div className="hidden md:flex items-center gap-8 text-white/80 text-sm font-medium">
            <a href="#features" className="hover:text-white transition-colors">Ce include</a>
            <a href="#how" className="hover:text-white transition-colors">Cum funcționează</a>
            <a href="#pricing" className="hover:text-white transition-colors">Prețuri</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-white text-rose-700 hover:bg-rose-50 font-semibold">
                  Evenimentele mele →
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 border border-white/30">
                    Intră în cont
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-white text-rose-700 hover:bg-rose-50 font-semibold">
                    Începe gratuit
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative h-screen min-h-[680px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1920&q=85"
          alt="Wedding"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <p className="text-rose-300 text-sm font-medium tracking-[0.25em] uppercase mb-6">
            Cel mai simplu organizator de nuntă din România
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl sm:text-7xl font-bold leading-tight mb-6">
            Ziua ta perfectă,<br />
            <span className="italic font-normal text-rose-200">organizată împreună</span>
          </h1>
          <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Invitați, mese, RSVP și Plannerul nostru — totul într-un singur loc.
            Tu și partenerul editați în timp real, de pe orice dispozitiv.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-10 text-base h-13 rounded-full shadow-xl shadow-rose-900/30">
                Încearcă Gratuit
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-10 text-base h-13 rounded-full bg-transparent">
                Descoperă funcțiile
              </Button>
            </a>
          </div>
          <p className="text-white/40 text-sm mt-6">Gratuit pentru nunți cu până la 50 invitați</p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-rose-600 text-white py-5">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { value: '100%', label: 'Gratuit pentru start' },
            { value: 'Timp real', label: 'Colaborare live' },
            { value: '50', label: 'invitați la planul gratuit' },
            { value: 'Basic & Pro', label: 'beneficii în funcție de nevoile tale' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">{s.value}</p>
              <p className="text-rose-200 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-4 bg-stone-50">
        <div className="max-w-6xl mx-auto space-y-16">

          {/* Screenshot cards */}
          <div>
            <div className="text-center mb-16">
              <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-3">Tot ce ai nevoie</p>
              <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold text-gray-900">
                Simplu. Elegant. <span className="italic">Complet.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { img: '/sc-invitati.png', align: 'top' as const, title: 'Gestionare invitați', desc: 'Adaugă manual sau importă din Excel. Statistici complete: porții, mărturii, RSVP — totul actualizat în timp real.' },
                { img: '/sc-mese.png', align: 'top' as const, title: 'Plan mese drag & drop', desc: 'Trage invitații la mese pe un plan vizual al sălii cu parchet. Adaugă ring de dans, DJ, candy bar și orice element.' },
              ].map((f) => (
                <div key={f.title} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100">
                  <div className="bg-stone-100 px-3 py-2 flex items-center gap-1.5 border-b border-stone-200 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <div className="h-80 overflow-hidden">
                    <img src={f.img} alt={f.title} className={`w-full h-full object-cover object-${f.align} group-hover:scale-[1.02] transition-transform duration-500`} />
                  </div>
                  <div className="p-6">
                    <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 9 feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🍽️', title: 'Porții mâncare per persoană', desc: 'Normal, jumătate sau fără meniu — setezi individual pentru fiecare invitat și însoțitor.' },
              { icon: '🎁', title: 'Mărturii calculate automat', desc: '1 marturie per invitație. Cuplurile împart una. Numărul se actualizează în timp real.' },
              { icon: '👫', title: 'Invitați cu însoțitor', desc: 'Single sau cuplu — cu prenume și nume separate. La import din RSVP se adaugă automat +1.' },
              { icon: '💌', title: 'Link RSVP public', desc: 'Fără cont, fără instalat nimic. Invitatul confirmă sau refuză în 30 de secunde.' },
              { icon: '🪑', title: 'Plan mese vizual', desc: 'Drag & drop pe harta sălii. Mese rotunde, dreptunghiulare, masa mirilor — totul configurat.' },
              { icon: '🏛️', title: 'Elemente de sală', desc: 'Ring de dans, DJ, Photo Booth, Candy Bar, Bar, trupă live — plasate liber pe planșă.' },
              { icon: '📊', title: 'Statistici complete', desc: 'Total persoane, confirmați, refuzați, porții, mărturii — totul vizibil dintr-o privire.' },
              { icon: '🤝', title: 'Colaborare în timp real', desc: 'Tu și partenerul modificați simultan. Fiecare schimbare apare instant pentru toți.' },
              { icon: '📥', title: 'Import & Export', desc: 'Importă lista din Excel cu un click. Exportă oricând pentru restaurant sau tipărit.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-5 bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-rose-100 transition-all duration-200 group">
                <div className="w-11 h-11 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center text-xl shrink-0 transition-colors duration-200">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1 leading-snug">{f.title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pro spotlight — De ce Nunta Mea */}
          <div>
            <div className="text-center mb-10">
              <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-3">De ce Nunta Mea</p>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-gray-900">
                Instrumente pe care <span className="italic font-normal text-gray-400">nu le găsești altundeva</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Wedding Planner To-Do */}
              <div className="rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-950 to-stone-900 flex flex-col p-8 space-y-5">
                <span className="inline-block text-xs font-bold bg-rose-600 text-white px-3 py-1 rounded-full w-fit">Exclusiv Pro</span>
                <div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white">Wedding Planner To-Do</h3>
                  <p className="text-stone-400 text-sm mt-2 leading-relaxed">O listă de sarcini gândită special pentru nunți. De la florărie la DJ — totul organizat pe categorii, cu termene și progres vizibil.</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-stone-400">4 din 26 sarcini rezolvate</span>
                    <span className="text-rose-400 font-bold text-sm">15%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div className="h-full w-[15%] bg-gradient-to-r from-rose-400 to-rose-600 rounded-full" />
                  </div>
                  {[
                    { done: true, label: 'Vizitat locația' },
                    { done: true, label: 'Contract fotograf semnat' },
                    { done: false, label: 'Degustare meniu' },
                    { done: false, label: 'Vorbit cu DJ' },
                    { done: false, label: 'Confirmare buchet mireasă' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${item.done ? 'bg-green-500' : 'border border-white/20'}`}>
                        {item.done && <span className="text-white text-[9px] font-bold">✓</span>}
                      </div>
                      <span className={`text-xs truncate ${item.done ? 'line-through text-stone-500' : 'text-stone-300'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register?plan=pro">
                  <Button className="bg-rose-600 hover:bg-rose-700 rounded-full font-semibold text-sm px-6 w-full">Încearcă Pro →</Button>
                </Link>
              </div>

              {/* Calculator Cinste */}
              <div className="rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-950 to-stone-900 flex flex-col p-8 space-y-5">
                <span className="inline-block text-xs font-bold bg-rose-600 text-white px-3 py-1 rounded-full w-fit">Exclusiv Pro</span>
                <div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white">Calculator Cinste</h3>
                  <p className="text-stone-400 text-sm mt-2 leading-relaxed">Marchezi cine a fost prezent, introduci cinstea în RON și aplicația îți calculează automat totalul și media per invitație.</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2 flex-1">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Total colectat', value: '14.200 RON', color: 'text-white' },
                      { label: 'Prezenți', value: '68', color: 'text-green-400' },
                      { label: 'Medie', value: '790 RON', color: 'text-rose-400' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 rounded-xl p-2.5 text-center">
                        <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {[
                    { name: 'Familia Popescu', present: true, gift: '1.000' },
                    { name: 'Ion & Maria', present: true, gift: '800' },
                    { name: 'Andrei Constantin', present: false, gift: null },
                    { name: 'Familia Ionescu', present: true, gift: '500' },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${row.present ? 'bg-green-400' : 'bg-stone-600'}`} />
                      <span className={`flex-1 truncate ${row.present ? 'text-stone-300' : 'text-stone-600 line-through'}`}>{row.name}</span>
                      <span className={`font-semibold shrink-0 ${row.present ? 'text-rose-300' : 'text-stone-600'}`}>{row.gift ? `${row.gift} RON` : '—'}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register?plan=pro">
                  <Button className="bg-rose-600 hover:bg-rose-700 rounded-full font-semibold text-sm px-6 w-full">Încearcă Pro →</Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── RSVP SHOWCASE ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-3">Fluxul RSVP complet</p>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Invitatul confirmă.<br />
              <span className="italic font-normal text-gray-400">Tu gestionezi tot.</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4 max-w-md mx-auto leading-relaxed">
              Un link public — fără cont, fără instalat nimic. Răspunsurile apar instant în panoul tău și le muți în lista oficială cu un click.
            </p>
          </div>

          {/* Two-column: form + panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* RSVP form */}
            <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200">
              <div className="bg-stone-100 px-3 py-2 flex items-center gap-1.5 border-b border-stone-200">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <img src="/sc-rsvp.png" alt="Formular RSVP" className="w-full block" />
            </div>

            {/* RSVP panel */}
            <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200">
              <div className="bg-stone-100 px-3 py-2 flex items-center gap-1.5 border-b border-stone-200">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <img src="/sc-rsvp-panel.png" alt="Panou RSVP cu răspunsuri" className="w-full block" />
            </div>
          </div>
        </div>
      </section>

      {/* ── REALTIME SPLIT ── */}
      <section className="py-28 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Visual side */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-200">
              <div className="bg-stone-100 px-3 py-2 flex items-center gap-1.5 border-b border-stone-200">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <img
                src="/sc-mese.png"
                alt="Colaborare în timp real pe harta meselor"
                className="w-full object-cover object-top"
                style={{ maxHeight: '340px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            {/* Floating activity card */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-2xl p-4 w-64 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-3">Feed activitate live ⚡</p>
              <div className="space-y-2.5">
                {[
                  { user: 'Ana', action: 'a mutat Ionescu la Masa 4', time: '2 min' },
                  { user: 'Mihai', action: 'a adăugat Popescu Dan', time: '5 min' },
                  { user: 'Ana', action: 'a confirmat RSVP', time: '8 min' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {item.user[0]}
                    </div>
                    <div>
                      <span className="font-semibold">{item.user}</span>{' '}
                      <span className="text-gray-500">{item.action}</span>
                      <p className="text-gray-300 mt-0.5">{item.time} în urmă</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Text side */}
          <div className="space-y-6">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase">Colaborare în timp real</p>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Tu muți un invitat.<br />
              <span className="italic font-normal text-gray-500">Partenerul vede instant.</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Fără refresh. Fără confuzie. Fiecare schimbare apare în timp real pentru toți colaboratorii,
              cu feed de activitate care arată exact ce s-a modificat și cine a modificat.
            </p>
            <ul className="space-y-3">
              {[
                'Editare simultană de pe orice dispozitiv',
                'Feed activitate cu fiecare modificare',
                'Roluri: proprietar, editor, vizualizator',
                'Link de invitație cu un click',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <Button className="bg-rose-600 hover:bg-rose-700 rounded-full px-8 mt-2">
                Încearcă gratuit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ROW ── */}
      <section className="py-8 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-rose-50 rounded-2xl px-8 py-6 border border-rose-100">
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-gray-900">
                Tot ce ai nevoie, într-un singur loc.
              </p>
              <p className="text-gray-400 text-sm mt-1">Gratuit pentru nunți cu până la 50 de invitați.</p>
            </div>
            <Link href="/register" className="shrink-0">
              <Button className="bg-rose-600 hover:bg-rose-700 rounded-full px-8 font-semibold">
                Încearcă gratuit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-28 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-3">Proces simplu</p>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold text-gray-900">
              Gata în <span className="italic">4 pași</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Creează contul', desc: 'Google sau email. Zero formulare lungi, gata în 30 de secunde.' },
              { step: '02', title: 'Adaugă invitații', desc: 'Manual, sau importă direct din Excel cu un click.' },
              { step: '03', title: 'Aranjează mesele', desc: 'Drag & drop vizual. Capacitate, formă, ordine — totul controlat.' },
              { step: '04', title: 'Invită partenerul', desc: 'Un link de colaborare. Editare simultană, în timp real.' },
            ].map((s) => (
              <div key={s.step} className="text-center space-y-4">
                <div className="font-[family-name:var(--font-playfair)] text-6xl font-bold text-rose-100 leading-none">
                  {s.step}
                </div>
                <div className="-mt-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-3">Prețuri transparente</p>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold text-gray-900">
              Plătești o singură dată.<br />
              <span className="italic font-normal text-gray-500">Nicio surpriză.</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4">Cu ~50% mai ieftin față de alte soluții din România</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {[
              {
                name: 'Gratuit', price: '0', period: 'pentru totdeauna',
                desc: 'Perfect pentru a testa',
                features: ['1 eveniment, 50 invitați, 10 mese', 'Link RSVP public', 'Import & Export CSV', 'Statistici porții & mărturii', 'Plan mese vizual'],
                cta: 'Începe gratuit', href: '/register', highlight: false,
              },
              {
                name: 'Basic', price: '79', period: 'o singură dată',
                desc: 'Tot ce ai nevoie pentru nunta ta',
                features: ['1 eveniment, până la 230 invitați', 'Mese nelimitate', 'Link RSVP public', 'Import & Export CSV', 'Statistici porții & mărturii', 'Plan mese vizual', '2 colaboratori', 'Feed activitate live', '🎁 Calculator Cinste', '💰 Buget & Costuri'],
                cta: 'Alege Basic', href: '/register?plan=basic', highlight: false,
              },
              {
                name: 'Pro', price: '109', period: 'o singură dată',
                desc: 'Pentru organizatori & planners',
                features: ['Evenimente nelimitate', 'Invitați nelimitați', 'Mese nelimitate', 'Link RSVP public', 'Import & Export CSV', 'Statistici porții & mărturii', 'Plan mese vizual', 'Export PDF plan mese', 'Colaboratori nelimitați', 'Feed activitate live', 'Wedding Planner To-Do', '🎁 Calculator Cinste', '💰 Buget & Costuri', 'Suport prioritar'],
                cta: 'Alege Pro', href: '/register?plan=pro', highlight: true,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl p-8 ${p.highlight
                  ? 'bg-rose-600 text-white shadow-2xl shadow-rose-200 scale-105'
                  : 'bg-stone-50 border border-gray-100'
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-rose-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    CEL MAI POPULAR
                  </div>
                )}
                <div className="mb-6 min-h-[72px]">
                  <p className={`font-[family-name:var(--font-playfair)] text-2xl font-bold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {p.name}
                  </p>
                  <p className={`text-sm mt-1 ${p.highlight ? 'text-rose-200' : 'text-gray-400'}`}>{p.desc}</p>
                </div>
                <div className="mb-6">
                  <span className={`font-[family-name:var(--font-playfair)] text-5xl font-bold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {p.price}
                  </span>
                  <span className={`text-sm ml-1 ${p.highlight ? 'text-rose-200' : 'text-gray-400'}`}>
                    RON · {p.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${p.highlight ? 'text-rose-100' : 'text-gray-600'}`}>
                      <span className={`font-bold shrink-0 ${p.highlight ? 'text-white' : 'text-rose-500'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className="block mt-auto">
                  <Button
                    className={`w-full rounded-full font-semibold ${p.highlight
                      ? 'bg-white text-rose-600 hover:bg-rose-50'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative py-32 px-4 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1546032996-6dfacbacbf3f?w=1920&q=80"
          alt="Wedding"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white space-y-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-6xl font-bold leading-tight">
            Nunta voastră merită<br />
            <span className="italic font-normal text-rose-200">cel mai bun plan</span>
          </h2>
          <p className="text-white/70 text-lg">
            Gratuit pentru start. Upgrade oricând. Fără abonament.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-rose-600 hover:bg-rose-700 rounded-full px-12 text-base mt-4 shadow-xl shadow-rose-900/40">
              Creează cont gratuit
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 pb-10 border-b border-white/10">
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-2">
                Nunta <span className="italic font-normal">Mea</span>
              </p>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                Cel mai simplu și modern organizator de nuntă din România.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm text-gray-400">
              <Link href="/register" className="hover:text-white transition-colors">Înregistrare</Link>
              <Link href="/login" className="hover:text-white transition-colors">Autentificare</Link>
              <a href="#features" className="hover:text-white transition-colors">Ce include</a>
              <a href="#pricing" className="hover:text-white transition-colors">Prețuri</a>
              <Link href="/termeni" className="hover:text-white transition-colors">Termeni și condiții</Link>
              <Link href="/confidentialitate" className="hover:text-white transition-colors">Confidențialitate</Link>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-xs">
            <p>© 2026 Nunta Mea · Realizat de Nexora Digital. Toate drepturile rezervate.</p>
            <p>Plată securizată prin Stripe · Fără reînnoire automată</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
