import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileSettings from '@/components/shared/ProfileSettings'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Contul meu</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestionează informațiile profilului tău.</p>
      </div>
      <ProfileSettings profile={profile} />
    </div>
  )
}
