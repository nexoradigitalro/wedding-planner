'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { generateInitials } from '@/lib/utils'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
}

export default function DashboardNav({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const planTier = profile?.plan_tier ?? 'free'

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </span>
          <span className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-gray-900 tracking-wide group-hover:text-rose-600 transition-colors">
            Planner <span className="italic font-normal text-rose-600">Nuntă</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-stone-100 px-3 py-1.5 rounded-full transition-colors"
          >
            Evenimentele mele
          </Link>
          {planTier === 'free' && (
            <Link
              href="/#pricing"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-stone-100 px-3 py-1.5 rounded-full transition-colors"
            >
              Planuri
            </Link>
          )}
          {planTier === 'free' && (
            <Link
              href="/upgrade"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-full transition-colors"
            >
              Upgrade
            </Link>
          )}
          {planTier !== 'free' && (
            <span className="hidden sm:inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full">
              {planTier === 'pro' ? 'Pro' : 'Basic'}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2">
              <Avatar className="h-9 w-9 border-2 border-stone-200">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-rose-100 text-rose-700 text-sm font-semibold">
                  {profile?.full_name ? generateInitials(profile.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-stone-200">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name ?? 'Utilizator'}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                Evenimentele mele
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                Contul meu
              </DropdownMenuItem>
              {planTier === 'free' && (
                <DropdownMenuItem onClick={() => router.push('/#pricing')} className="cursor-pointer">
                  Planuri & prețuri
                </DropdownMenuItem>
              )}
              {planTier === 'free' && (
                <DropdownMenuItem onClick={() => router.push('/upgrade')} className="text-rose-600 font-medium cursor-pointer">
                  Upgrade la Pro
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer">
                Deconectare
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
