'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function DashboardPage() {
  const [lists, setLists] = useState<any[]>([])
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  const today = new Date().getDay()
  const todayName = DAYS[today]

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single()

      if (!profile?.business_id) { setReady(true); return }

      const { data: listsData } = await supabase
        .from('lists')
        .select('*, tasks(*)')
        .eq('business_id', profile.business_id)
        .order('created_at')

      const filtered = (listsData ?? []).map(list => ({
        ...list,
        tasks: (list.tasks ?? []).filter((t: any) => t.days_of_week.includes(today))
      })).filter(list => list.tasks.length > 0)

      setLists(filtered)
      setReady(true)
    }
    init()
  }, [router, today])

  const tickTask = async (taskId: string) => {
    if (ticked[taskId] || !userId) return
    setTicked(prev => ({ ...prev, [taskId]: true }))
    await supabase.from('completions').insert({ task_id: taskId, user_id: userId })
  }

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '2rem' }}>
      <div style={{ background: 'white', padding: '1rem 1.25rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#111', margin: 0 }}>TaskFlow</h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{todayName}</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          style={{ fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {lists.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', marginTop: '3rem' }}>No tasks for today!</p>
        )}

        {lists.map(list => (
          <div key={list.id} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              {list.name}
            </h2>

            {list.tasks.map((task: any) => {
              const done = ticked[task.id]
              return (
                <button key={task.id} onClick={() => tickTask(task.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', marginBottom: '8px',
                    background: done ? '#f0fdf4' : 'white',
                    border: done ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                    borderRadius: '12px', cursor: done ? 'default' : 'pointer',
                    textAlign: 'left'
                  }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    border: done ? 'none' : '2px solid #d1d5db',
                    background: done ? '#16a34a' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {done && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '16px', color: done ? '#16a34a' : '#111', fontWeight: '500', textDecoration: done ? 'line-through' : 'none' }}>
                    {task.title}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
