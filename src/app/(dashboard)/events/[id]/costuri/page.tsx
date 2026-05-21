import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BudgetPlanner from '@/components/budget/BudgetPlanner'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CosturiPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .single()

  const role = member?.role ?? 'viewer'
  const canEdit = role === 'owner' || role === 'editor'

  const { data: items } = await supabase
    .from('budget_items')
    .select('*')
    .eq('event_id', id)
    .order('created_at')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Buget Nuntă</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Urmărește cheltuielile estimate și plățile efectuate pentru fiecare categorie.
        </p>
      </div>
      <BudgetPlanner eventId={id} initialItems={items ?? []} canEdit={canEdit} />
    </div>
  )
}
