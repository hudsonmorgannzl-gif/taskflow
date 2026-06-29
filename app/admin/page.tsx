'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminPage() {
  const [lists, setLists] = useState<any[]>([])
  const [listName, setListName] = useState('')
  const [taskInputs, setTaskInputs] = useState<Record<string, { title: string; days: number[] }>>({})
  const [loading, setLoading] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id, role')
        .eq('id', user.id)
        .single()

      if (!profile?.business_id) { setReady(true); return }

      setBusinessId(profile.business_id)
      await fetchLists(profile.business_id)
      setReady(true)
    }
    init()
  }, [router])

  const fetchLists = async (bid: string) => {
    const { data } = await supabase
      .from('lists')
      .select('*, tasks(*)')
      .eq('business_id', bid)
      .order('created_at')
    setLists(data ?? [])
  }

  const createList = async () => {
    if (!listName.trim() || !businessId) return
    setLoading(true)
    await supabase.from('lists').insert({ name: listName, business_id: businessId })
    setListName('')
    await fetchLists(businessId)
    setLoading(false)
  }

  const deleteList = async (id: string) => {
    await supabase.from('tasks').delete().eq('list_id', id)
    await supabase.from('lists').delete().eq('id', id)
    if (businessId) await fetchLists(businessId)
  }

  const getTaskInput = (listId: string) => {
    return taskInputs[listId] ?? { title: '', days: [0, 1, 2, 3, 4, 5, 6] }
  }

  const setTaskInput = (listId: string, value: { title: string; days: number[] }) => {
    setTaskInputs(prev => ({ ...prev, [listId]: value }))
  }

  const toggleDay = (listId: string, day: number) => {
    const input = getTaskInput(listId)
    const days = input.days.includes(day)
      ? input.days.filter(d => d !== day)
      : [...input.days, day].sort()
    setTaskInput(listId, { ...input, days })
  }

  const addTask = async (listId: string) => {
    const input = getTaskInput(listId)
    if (!input.title.trim()) return
    await supabase.from('tasks').insert({
      list_id: listId,
      title: input.title,
      days_of_week: input.days
    })
    setTaskInput(listId, { title: '', days: [0, 1, 2, 3, 4, 5, 6] })
    if (businessId) await fetchLists(businessId)
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
    if (businessId) await fetchLists(businessId)
  }

  if (!ready) return <p style={{ padding: '2rem', color: '#888' }}>Loading...</p>

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111' }}>Admin — Task Lists</h1>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            style={{ fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight: '500', marginBottom: '0.75rem', color: '#111' }}>Create a new list</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={listName}
              onChange={e => setListName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createList()}
              placeholder="e.g. Morning Tasks, Closing Tasks..."
              style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', color: '#111' }}
            />
            <button onClick={createList} disabled={loading}
              style={{ padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
              Add
            </button>
          </div>
        </div>

        {lists.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', marginTop: '3rem' }}>No lists yet — create your first one above!</p>
        )}

        {lists.map(list => {
          const input = getTaskInput(list.id)
          return (
            <div key={list.id} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#111' }}>{list.name}</h2>
                <button onClick={() => deleteList(list.id)}
                  style={{ fontSize: '13px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Delete list
                </button>
              </div>

              {list.tasks?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {list.tasks.map((task: any) => (
                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#111', margin: 0 }}>{task.title}</p>
                        <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>
                          {task.days_of_week.length === 7 ? 'Every day' : task.days_of_week.map((d: number) => DAYS[d]).join(', ')}
                        </p>
                      </div>
                      <button onClick={() => deleteTask(task.id)}
                        style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '0.75rem' }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#555', marginBottom: '8px' }}>Add a task</p>
                <input
                  value={input.title}
                  onChange={e => setTaskInput(list.id, { ...input, title: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addTask(list.id)}
                  placeholder="Task name..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', color: '#111', marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {DAYS.map((day, i) => (
                    <button key={i} onClick={() => toggleDay(list.id, i)}
                      style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: 'none',
                        background: input.days.includes(i) ? '#16a34a' : '#e5e7eb',
                        color: input.days.includes(i) ? 'white' : '#555',
                        fontWeight: '500'
                      }}>
                      {day}
                    </button>
                  ))}
                </div>
                <button onClick={() => addTask(list.id)}
                  style={{ padding: '8px 14px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  Add task
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
