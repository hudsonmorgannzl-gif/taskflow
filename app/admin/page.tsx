'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [lists, setLists] = useState<any[]>([])
  const [listName, setListName] = useState('')
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

      if (!profile?.business_id) {
        setReady(true)
        return
      }

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
    await supabase.from('lists').delete().eq('id', id)
    if (businessId) await fetchLists(businessId)
  }

  if (!ready) return <p style={{ padding: '2rem', color: '#888' }}>Loading...</p>

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', padding: '1.5rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600' }}>Admin — Task Lists</h1>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            style={{ fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>

        {!businessId && (
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>No business linked to your account. Contact support.</p>
        )}

        {businessId && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontWeight: '500', marginBottom: '0.75rem' }}>Create a new list</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={listName}
                onChange={e => setListName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createList()}
                placeholder="e.g. Morning Tasks, Closing Tasks..."
                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
              />
              <button onClick={createList} disabled={loading}
                style={{ padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
                Add
              </button>
            </div>
          </div>
        )}

        {lists.length === 0 && businessId && (
          <p style={{ color: '#888', textAlign: 'center', marginTop: '3rem' }}>No lists yet — create your first one above!</p>
        )}

        {lists.map(list => (
          <div key={list.id} style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '500' }}>{list.name}</h2>
              <button onClick={() => deleteList(list.id)}
                style={{ fontSize: '13px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
              {list.tasks?.length ?? 0} task{list.tasks?.length !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
