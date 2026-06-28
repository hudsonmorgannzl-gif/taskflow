'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setEmail(user.email ?? '')
      }
    }
    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '0.5rem' }}>Welcome to TaskFlow 👋</h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '2rem' }}>{email}</p>
        <button
          onClick={handleSignOut}
          style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
