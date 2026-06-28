'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/admin')
  }, [router])

  return <p style={{ padding: '2rem' }}>Redirecting...</p>
}
