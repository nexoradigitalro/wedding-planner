import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termeni și condiții — Planner Nuntă',
  description: 'Termenii și condițiile de utilizare ale platformei Planner Nuntă.',
}

export default function TermeniPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-rose-600 hover:text-rose-700 font-medium mb-8 inline-block">
          ← Înapoi la pagina principală
        </Link>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-gray-900 mb-2">
          Termeni și condiții
        </h1>
        <p className="text-gray-400 text-sm mb-10">Ultima actualizare: mai 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptarea termenilor</h2>
            <p>
              Prin accesarea și utilizarea platformei <strong>Planner Nuntă</strong> (disponibilă la plannernunta.ro), operată de
              <strong> SAM PROJECT S.R.L.</strong> (CUI: 46030433, J2022000502018, sediu: Sat Șeușa, Comuna Ciugud, Jud. Alba, Strada Lalelelor, Nr. 31),
              ești de acord să respecți acești termeni și condiții. Dacă nu ești de acord, te rugăm să nu folosești serviciul.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrierea serviciului</h2>
            <p>
              Planner Nuntă este o platformă SaaS pentru organizarea nunților: gestionarea invitaților, planul de mese,
              colectarea RSVP-urilor și colaborare în timp real. Serviciul este disponibil în variante gratuite și plătite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Conturi și autentificare</h2>
            <p>
              Îți poți crea un cont prin Google OAuth sau email (magic link). Ești responsabil pentru securitatea
              contului tău. Nu îți partaja datele de acces. SAM PROJECT S.R.L. nu poate fi trasă la răspundere pentru
              accesul neautorizat cauzat de neglijența utilizatorului.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Planuri și plăți</h2>
            <p>
              Planurile <strong>Basic</strong> (79 RON) și <strong>Pro</strong> (109 RON) sunt disponibile prin plată
              unică, fără abonament. Plata se procesează securizat prin <strong>Stripe</strong>. Activarea planului are
              loc imediat după confirmarea plății.
            </p>
            <p className="mt-3">
              Accesul la funcțiile plătite este valabil <strong>12 luni</strong> de la data achiziției, acoperind
              intervalul tipic de planificare al unei nunți.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Politica de rambursare</h2>
            <p>
              Produsele digitale nu pot fi returnate după activare. În cazul unor probleme tehnice majore care
              împiedică utilizarea serviciului, poți contacta echipa noastră la <strong>nexoradigitalro@gmail.com</strong>
              în termen de 14 zile de la achiziție pentru o evaluare individuală.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Utilizare acceptată</h2>
            <p>Te angajezi să nu folosești platforma pentru:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Activități ilegale sau frauduloase</li>
              <li>Transmiterea de conținut spam sau ofensator</li>
              <li>Compromiterea securității platformei sau a altor utilizatori</li>
              <li>Reproducerea sau revânzarea serviciului fără acord scris</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Datele tale</h2>
            <p>
              Datele introduse (lista de invitați, detalii eveniment etc.) îți aparțin. Nu vindem și nu partajăm
              datele tale cu terțe părți, cu excepția furnizorilor tehnici necesari funcționării serviciului
              (Supabase pentru stocare, Stripe pentru plăți). Detalii în{' '}
              <Link href="/confidentialitate" className="text-rose-600 hover:underline">
                Politica de confidențialitate
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disponibilitatea serviciului</h2>
            <p>
              Ne străduim să menținem disponibilitatea serviciului la 99,9%. Nu garantăm funcționarea neîntreruptă
              și nu suntem răspunzători pentru pierderi cauzate de întreruperi temporare ale serviciului.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modificarea termenilor</h2>
            <p>
              Ne rezervăm dreptul de a modifica acești termeni. Vei fi notificat prin email cu cel puțin 14 zile
              înainte de intrarea în vigoare a unor modificări semnificative. Continuarea utilizării serviciului
              după această perioadă constituie acceptul modificărilor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>
              Pentru orice întrebări legate de acești termeni, ne poți contacta la:{' '}
              <strong>nexoradigitalro@gmail.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
