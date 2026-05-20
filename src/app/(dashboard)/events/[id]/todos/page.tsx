import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TodoList from '@/components/todos/TodoList'

interface Props {
  params: Promise<{ id: string }>
}

const DEFAULT_TODOS = [
  { category: 'Locatie', title: 'Rezervare sala de evenimente' },
  { category: 'Locatie', title: 'Vizitare si confirmare locatie' },
  { category: 'Locatie', title: 'Semnare contract sala' },
  { category: 'Catering', title: 'Degustare meniu' },
  { category: 'Catering', title: 'Confirmare numar de persoane' },
  { category: 'Catering', title: 'Confirmare meniu final' },
  { category: 'Fotografie', title: 'Selectare fotograf / videograf' },
  { category: 'Fotografie', title: 'Sedinta foto logodna' },
  { category: 'Fotografie', title: 'Confirmare program ziua nuntii' },
  { category: 'Muzica', title: 'Selectare formatie sau DJ' },
  { category: 'Muzica', title: 'Discutie playlist si melodii speciale' },
  { category: 'Muzica', title: 'Semnare contract muzica' },
  { category: 'Flori & Decor', title: 'Selectare florarie' },
  { category: 'Flori & Decor', title: 'Alegere aranjamente masa si sala' },
  { category: 'Flori & Decor', title: 'Confirmare buchet mireasa' },
  { category: 'Tinutele', title: 'Alegere rochie de mireasa' },
  { category: 'Tinutele', title: 'Alegere costum mire' },
  { category: 'Tinutele', title: 'Probe finale tinutele' },
  { category: 'Inele', title: 'Alegere verighete' },
  { category: 'Inele', title: 'Comanda si ridicare verighete' },
  { category: 'Invitatii', title: 'Design invitatii' },
  { category: 'Invitatii', title: 'Trimitere invitatii' },
  { category: 'General', title: 'Obtinere certificat prenuptial' },
  { category: 'General', title: 'Programare cununie civila' },
  { category: 'General', title: 'Aranjare liste cu martori' },
  { category: 'General', title: 'Rezervare luna de miere' },
]

export default async function TodosPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', user.id)
    .single()

  if (profile?.plan_tier !== 'pro') redirect(`/events/${id}/guests`)

  let { data: todos } = await supabase
    .from('wedding_todos')
    .select('*')
    .eq('event_id', id)
    .order('category')
    .order('created_at')

  // Pre-populate for new events
  if (!todos || todos.length === 0) {
    const { data: inserted } = await supabase
      .from('wedding_todos')
      .insert(DEFAULT_TODOS.map((t) => ({ ...t, event_id: id })))
      .select('*')
    todos = inserted ?? []
  }

  return <TodoList eventId={id} initialTodos={todos ?? []} />
}
