import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politică de confidențialitate — Planner Nuntă',
  description: 'Cum colectăm, stocăm și protejăm datele tale pe platforma Planner Nuntă.',
}

export default function ConfidentialitatePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-rose-600 hover:text-rose-700 font-medium mb-8 inline-block">
          ← Înapoi la pagina principală
        </Link>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-gray-900 mb-2">
          Politică de confidențialitate
        </h1>
        <p className="text-gray-400 text-sm mb-10">Ultima actualizare: mai 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Cine suntem</h2>
            <p>
              <strong>Planner Nuntă</strong> este operată de Nexora Digital. Suntem operatorul de date cu caracter
              personal în sensul Regulamentului (UE) 2016/679 (GDPR). Contact: <strong>nexoradigitalro@gmail.com</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Ce date colectăm</h2>
            <p><strong>Date de cont:</strong></p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Adresă de email (obligatorie pentru autentificare)</li>
              <li>Nume complet (opțional, din contul Google sau introdus manual)</li>
              <li>Fotografie de profil (opțional, din contul Google)</li>
            </ul>
            <p className="mt-4"><strong>Date introduse de tine:</strong></p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Lista de invitați (nume, email, telefon, preferințe alimentare)</li>
              <li>Detalii eveniment (nume, dată, locație)</li>
              <li>Planul de mese și asignările</li>
              <li>Răspunsuri RSVP primite de la invitați</li>
            </ul>
            <p className="mt-4"><strong>Date tehnice (colectate automat):</strong></p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Adresă IP (prin Supabase/Vercel)</li>
              <li>Informații despre browser și dispozitiv</li>
              <li>Jurnale de activitate în aplicație</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cum folosim datele</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Furnizarea și îmbunătățirea serviciului Planner Nuntă</li>
              <li>Autentificarea în cont și securitate</li>
              <li>Procesarea plăților (prin Stripe)</li>
              <li>Trimiterea emailurilor tranzacționale (magic link, RSVP)</li>
              <li>Asistență tehnică și suport</li>
            </ul>
            <p className="mt-3">
              Nu folosim datele tale pentru marketing terț, publicitate direcționată sau profilare automată.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Furnizori terți</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mt-2">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-stone-200">Furnizor</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-stone-200">Scop</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-stone-200">Date partajate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Supabase (SUA)', 'Bază de date, autentificare', 'Toate datele de cont și eveniment'],
                    ['Stripe (SUA)', 'Procesare plăți', 'Email, ID tranzacție'],
                    ['Vercel (SUA)', 'Hosting aplicație', 'Date de trafic web'],
                    ['Resend (SUA)', 'Emailuri tranzacționale', 'Email destinatar'],
                  ].map(([f, s, d]) => (
                    <tr key={f}>
                      <td className="px-4 py-2 border border-stone-200">{f}</td>
                      <td className="px-4 py-2 border border-stone-200">{s}</td>
                      <td className="px-4 py-2 border border-stone-200">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Toți furnizorii sunt certificați conform standardelor de securitate și GDPR (acorduri DPA în vigoare).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Durata păstrării datelor</h2>
            <p>
              Datele tale sunt păstrate pe durata utilizării contului. La ștergerea contului, toate datele
              (invitați, mese, RSVP) sunt eliminate permanent din baza de date în termen de 30 de zile.
              Datele de facturare Stripe sunt păstrate conform obligațiilor legale (7 ani).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Drepturile tale (GDPR)</h2>
            <p>Conform GDPR, ai dreptul la:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Acces</strong> — să soliciti o copie a datelor tale</li>
              <li><strong>Rectificare</strong> — să corectezi datele incorecte</li>
              <li><strong>Ștergere</strong> — să ștergi contul și toate datele aferente</li>
              <li><strong>Portabilitate</strong> — să exporți datele (CSV export disponibil în aplicație)</li>
              <li><strong>Opoziție</strong> — să te opui prelucrării în anumite circumstanțe</li>
            </ul>
            <p className="mt-3">
              Pentru exercitarea acestor drepturi, contactează-ne la <strong>nexoradigitalro@gmail.com</strong>.
              Răspundem în termen de 30 de zile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookie-uri</h2>
            <p>
              Folosim exclusiv cookie-uri tehnice necesare funcționării (sesiune de autentificare Supabase).
              Nu folosim cookie-uri de tracking sau publicitate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Securitate</h2>
            <p>
              Datele sunt stocate criptat în Supabase (PostgreSQL), cu comunicații TLS/HTTPS. Accesul la date
              este controlat prin politici de securitate la nivel de rând (Row Level Security). Parolele nu
              sunt stocate — autentificarea se face exclusiv prin magic link sau OAuth.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modificări</h2>
            <p>
              Orice modificare semnificativă a acestei politici va fi comunicată prin email cu cel puțin
              14 zile înainte. Versiunea curentă este întotdeauna disponibilă la această adresă.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact și reclamații</h2>
            <p>
              Pentru orice întrebări sau reclamații legate de prelucrarea datelor: <strong>nexoradigitalro@gmail.com</strong>
            </p>
            <p className="mt-3">
              Ai dreptul să depui o plângere la <strong>Autoritatea Națională de Supraveghere a Prelucrării
              Datelor cu Caracter Personal (ANSPDCP)</strong> — <a href="https://www.dataprotection.ro" className="text-rose-600 hover:underline">www.dataprotection.ro</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
