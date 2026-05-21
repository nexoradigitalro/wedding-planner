import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TodoList from '@/components/todos/TodoList'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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

  if (profile.plan_tier === 'free' || profile.plan_tier === 'basic') {
    return (
      <div className="max-w-lg mx-auto py-10 space-y-6">
        <div className="rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-950 to-stone-900 flex flex-col p-8 space-y-5">
          <span className="inline-block text-xs font-bold bg-rose-600 text-white px-3 py-1 rounded-full w-fit">Exclusiv Pro</span>
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white">Wedding Planner To-Do</h3>
            <p className="text-stone-400 text-sm mt-2 leading-relaxed">O listă de sarcini gândită special pentru nunți. De la florărie la DJ — totul organizat pe categorii, cu termene și progres vizibil.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-400">4 din 26 sarcini rezolvate</span>
              <span className="text-rose-400 font-bold text-sm">15%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div className="h-full w-[15%] bg-gradient-to-r from-rose-400 to-rose-600 rounded-full" />
            </div>
            {[
              { done: true, label: 'Vizitat locația' },
              { done: true, label: 'Contract fotograf semnat' },
              { done: false, label: 'Degustare meniu' },
              { done: false, label: 'Vorbit cu DJ' },
              { done: false, label: 'Confirmare buchet mireasă' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${item.done ? 'bg-green-500' : 'border border-white/20'}`}>
                  {item.done && <span className="text-white text-[9px] font-bold">✓</span>}
                </div>
                <span className={`text-xs truncate ${item.done ? 'line-through text-stone-500' : 'text-stone-300'}`}>{item.label}</span>
              </div>
            ))}
          </div>
          <Link href="/upgrade?autostart=pro">
            <Button className="bg-rose-600 hover:bg-rose-700 rounded-full font-semibold text-sm px-6 w-full">
              Activează Pro — 109 RON
            </Button>
          </Link>
          <p className="text-xs text-stone-500 text-center -mt-2">O singură plată · Fără abonament</p>
        </div>
      </div>
    )
  }

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
