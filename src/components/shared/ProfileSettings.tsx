'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateInitials } from '@/lib/utils'
import { toast } from 'sonner'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
}

export default function ProfileSettings({ profile }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null })
      .eq('id', profile!.id)
    if (error) {
      toast.error('Eroare: ' + error.message)
    } else {
      toast.success('Profil actualizat')
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDeleteAccount() {
    const res = await fetch('/api/profile/delete', { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json()
      toast.error('Eroare: ' + (body.error ?? 'Necunoscut'))
      return
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  const [portalLoading, setPortalLoading] = useState(false)
  const planLabel = profile?.plan_tier === 'pro' ? 'Pro' : profile?.plan_tier === 'basic' ? 'Basic' : 'Gratuit'

  async function handleOpenPortal() {
    setPortalLoading(true)
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnUrl: window.location.href }),
    })
    if (!res.ok) {
      toast.error('Nu există istoricul plăților pentru acest cont.')
      setPortalLoading(false)
      return
    }
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="space-y-5">
      {/* Profile info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informații profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-stone-200">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-rose-100 text-rose-700 text-lg font-semibold">
                  {profile?.full_name ? generateInitials(profile.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{profile?.full_name ?? 'Utilizator'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="full-name">Nume complet</Label>
              <input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ion Popescu"
                className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <input
                value={profile?.email ?? ''}
                disabled
                className="h-10 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Emailul nu poate fi modificat din profil.</p>
            </div>

            <Button type="submit" className="bg-rose-600 hover:bg-rose-700" disabled={saving}>
              {saving ? 'Se salvează...' : 'Salvează modificările'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Plan info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Planul tău</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Plan {planLabel}</p>
              {profile?.plan_expires_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Valabil până la {new Date(profile.plan_expires_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {profile?.plan_tier === 'free' && (
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => router.push('/upgrade')}>
                  Upgrade
                </Button>
              )}
              {profile?.plan_tier !== 'free' && (
                <Button size="sm" variant="outline" onClick={handleOpenPortal} disabled={portalLoading}>
                  {portalLoading ? 'Se încarcă...' : 'Istoricul plăților'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-red-600">Zonă periculoasă</CardTitle>
        </CardHeader>
        <CardContent>
          {!deleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Șterge contul</p>
                <p className="text-xs text-muted-foreground mt-0.5">Această acțiune este ireversibilă. Toate datele vor fi șterse.</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setDeleteConfirm(true)}>
                Șterge contul
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-700 font-medium">Ești sigur? Toate evenimentele și datele vor fi șterse permanent.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>Anulează</Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleDeleteAccount}>
                  Da, șterge contul
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
