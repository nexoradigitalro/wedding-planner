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
import { Badge } from '@/components/ui/badge'
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

  const planLabel = profile?.plan_tier === 'pro' ? 'Pro' : profile?.plan_tier === 'basic' ? 'Basic' : null

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-rose-600">
          💍 <span className="hidden sm:inline">Wedding Planner</span>
        </Link>

        <div className="flex items-center gap-3">
          {planLabel && (
            <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 text-xs">
              {planLabel}
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-400">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                  {profile?.full_name ? generateInitials(profile.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Utilizator'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                Evenimentele mele
              </DropdownMenuItem>
              {!planLabel && (
                <DropdownMenuItem onClick={() => router.push('/upgrade')} className="text-rose-600 font-medium">
                  ⬆ Upgrade la Pro
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                Deconectare
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
