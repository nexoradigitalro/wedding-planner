'use client'

import { useState } from 'react'

export default function SupportButton() {
  const [open, setOpen] = useState(false)
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

  function handleClose() {
    setOpen(false)
    setSent(false)
    setError(null)
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 w-80 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Suport & Contact</p>
              <p className="text-xs text-gray-400 mt-0.5">Răspundem în max. 24h</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-300 hover:text-gray-500 transition-colors ml-2 mt-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="h-px bg-stone-100" />

          {sent ? (
            <div className="text-center py-4 space-y-2">
              <div className="text-3xl">💌</div>
              <p className="font-semibold text-gray-900 text-sm">Mesaj trimis!</p>
              <p className="text-xs text-gray-400">Îți răspundem în cel mai scurt timp.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Numele tău"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 placeholder-gray-300"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 placeholder-gray-300"
                />
              </div>
              <div>
                <textarea
                  placeholder="Cum te putem ajuta?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={3}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 placeholder-gray-300 resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {loading ? 'Se trimite...' : 'Trimite mesaj'}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={`w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border ${
          open
            ? 'bg-gray-800 border-gray-700 text-white scale-95'
            : 'bg-white border-stone-200 text-gray-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:scale-105'
        }`}
        style={{ width: 52, height: 52 }}
        title="Contactează suport"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>
    </div>
  )
}
