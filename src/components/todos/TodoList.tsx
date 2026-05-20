'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Todo {
  id: string
  event_id: string
  title: string
  category: string
  done: boolean
  due_date: string | null
  created_at: string
}

interface Props {
  eventId: string
  initialTodos: Todo[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Locatie': 'bg-blue-50 text-blue-700 border-blue-100',
  'Catering': 'bg-orange-50 text-orange-700 border-orange-100',
  'Fotografie': 'bg-purple-50 text-purple-700 border-purple-100',
  'Muzica': 'bg-pink-50 text-pink-700 border-pink-100',
  'Flori & Decor': 'bg-green-50 text-green-700 border-green-100',
  'Tinutele': 'bg-rose-50 text-rose-700 border-rose-100',
  'Inele': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  'Invitatii': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'General': 'bg-gray-50 text-gray-700 border-gray-100',
}

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'bg-stone-50 text-stone-700 border-stone-200'
}

function formatDate(d: string) {
  const [year, month, day] = d.split('-')
  const months = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

export default function TodoList({ eventId, initialTodos }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newDay, setNewDay] = useState('')
  const [newMonth, setNewMonth] = useState('')
  const [newYear, setNewYear] = useState('')
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  const MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']

  function buildDate() {
    if (!newDay || !newMonth || !newYear) return null
    const m = String(MONTHS.indexOf(newMonth) + 1).padStart(2, '0')
    const d = String(newDay).padStart(2, '0')
    return `${newYear}-${m}-${d}`
  }

  const done = todos.filter((t) => t.done).length
  const total = todos.length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const grouped = todos.reduce<Record<string, Todo[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  async function toggleTodo(todo: Todo) {
    const next = !todo.done
    setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, done: next } : t))
    await supabase.from('wedding_todos').update({ done: next }).eq('id', todo.id)
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('wedding_todos').delete().eq('id', id)
  }

  async function addTodo() {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const { data, error } = await supabase
        .from('wedding_todos')
        .insert({
          event_id: eventId,
          title: newTitle.trim(),
          category: newCategory.trim() || 'General',
          due_date: buildDate(),
        })
        .select('*')
        .single()
      if (error) { toast.error('Eroare: ' + error.message); return }
      setTodos((prev) => [...prev, data as Todo])
      setNewTitle('')
      setNewCategory('')
      setNewDay('')
      setNewMonth('')
      setNewYear('')
    } catch (e) {
      toast.error('Eroare neașteptată')
      console.error(e)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-gray-900">Wedding Planner To-Do</p>
            <p className="text-sm text-gray-400 mt-0.5">{done} din {total} sarcini rezolvate</p>
          </div>
          <span className={cn('text-3xl font-bold', pct === 100 ? 'text-green-600' : 'text-rose-600')}>{pct}%</span>
        </div>
        <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-rose-400 to-rose-600')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Add task */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Sarcină nouă</p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: Vorbit cu DJ..."
            className="h-9 flex-1 min-w-48 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          />
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Categorie (ex: Muzica)"
            list="todo-categories"
            className="h-9 w-44 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
          />
          <datalist id="todo-categories">
            {Object.keys(CATEGORY_COLORS).map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-gray-400 shrink-0">📅 Termen:</span>
          <input
            type="number"
            value={newDay}
            onChange={(e) => setNewDay(e.target.value)}
            placeholder="Zi"
            min={1} max={31}
            className="h-9 w-16 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
          />
          <select
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-rose-400 transition-colors"
          >
            <option value="">Lună</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            type="number"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            placeholder="An"
            min={2024} max={2035}
            className="h-9 w-20 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-colors"
          />
          <Button
            className="bg-rose-600 hover:bg-rose-700 shrink-0 ml-auto"
            onClick={addTodo}
            disabled={adding || !newTitle.trim()}
          >
            + Adaugă
          </Button>
        </div>
      </div>

      {/* Grouped todos */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', categoryColor(category))}>
              {category}
            </span>
            <span className="text-xs text-gray-400">
              {items.filter((t) => t.done).length}/{items.length}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
            {items.map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group transition-colors">
                <button
                  onClick={() => toggleTodo(todo)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                    todo.done
                      ? 'bg-green-500 border-green-500 text-white shadow-sm'
                      : 'border-gray-300 hover:border-rose-400 hover:bg-rose-50'
                  )}
                >
                  {todo.done && <span className="text-xs font-bold">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', todo.done && 'line-through text-gray-400')}>
                    {todo.title}
                  </p>
                  {todo.due_date && (
                    <p className={cn('text-xs mt-0.5', todo.done ? 'text-gray-300' : 'text-rose-500')}>
                      📅 {formatDate(todo.due_date)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-sm px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
