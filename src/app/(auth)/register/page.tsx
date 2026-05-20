'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')

  function callbackUrl() {
    const base = `${location.origin}/auth/callback`
    return plan ? `${base}?plan=${plan}` : base
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl(),
        data: { full_name: name },
      },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — photo panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=85"
          alt="Wedding"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-rose-900/50" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white tracking-wide">
            Nunta <span className="italic font-normal text-rose-300">Mea</span>
          </Link>
          <div className="space-y-4">
            {[
              { icon: '💑', text: 'Tu și partenerul organizați împreună, în timp real' },
              { icon: '🪑', text: 'Plan mese drag & drop — invitații la locul lor în minute' },
              { icon: '💌', text: 'Link RSVP pentru invitați — fără cont, fără instalat nimic' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-white/75 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden font-[family-name:var(--font-playfair)] text-2xl font-semibold text-gray-900 mb-10">
          Nunta <span className="italic font-normal text-rose-600">Mea</span>
        </Link>

        <div className="w-full max-w-sm space-y-8">
          {sent ? (
            <div className="text-center space-y-5 py-8">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-2xl">
                ✉️
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900">Verifică emailul</h2>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                  Am trimis un link de confirmare la<br />
                  <span className="font-semibold text-gray-700">{email}</span>
                </p>
              </div>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-rose-600 hover:underline"
              >
                Trimite din nou
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-gray-900">
                  Creează cont gratuit
                </h1>
                <p className="text-gray-400 text-sm">Gata în 30 de secunde. Fără card.</p>
              </div>

              {/* Google */}
              <Button
                variant="outline"
                className="w-full h-11 gap-3 border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-gray-700 font-medium rounded-xl"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuă cu Google
              </Button>

              {/* Divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="text-xs text-gray-400 font-medium">sau cu email</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Numele vostru</Label>
                  <Input
                    id="name"
                    placeholder="Ana și Mihai"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl border-stone-200 focus-visible:border-rose-400 focus-visible:ring-rose-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@exemplu.ro"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-stone-200 focus-visible:border-rose-400 focus-visible:ring-rose-200"
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-11 bg-rose-600 hover:bg-rose-700 rounded-xl font-semibold text-sm"
                  disabled={loading || !email || !name}
                >
                  {loading ? 'Se trimite...' : 'Creează cont gratuit'}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-400">
                Ai deja cont?{' '}
                <Link href="/login" className="text-rose-600 hover:underline font-semibold">
                  Intră în cont
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
