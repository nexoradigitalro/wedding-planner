'use client'

import { useState } from 'react'

export default function LandingContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    })
    if (res.ok) {
      setSent(true)
    } else {
      setError('Eroare la trimitere. Încearcă din nou.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-10 space-y-3">
        <div className="text-5xl">💌</div>
        <p className="font-semibold text-gray-900 text-lg">Mesaj trimis!</p>
        <p className="text-gray-400 text-sm">Îți răspundem în cel mai scurt timp.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Numele tău</label>
          <input
            type="text"
            placeholder="Ion Popescu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
          <input
            type="email"
            placeholder="ion@email.ro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Mesajul tău</label>
        <textarea
          placeholder="Cum te putem ajuta?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors resize-none"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-full text-sm transition-colors shadow-lg shadow-rose-200"
      >
        {loading ? 'Se trimite...' : 'Trimite mesaj'}
      </button>
    </form>
  )
}
