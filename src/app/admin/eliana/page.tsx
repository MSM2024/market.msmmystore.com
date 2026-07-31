'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, hasRole, refreshSession } from '@/lib/auth'
import ElianaAdminDashboard from '@/components/eliana/ElianaAdminDashboard'

export default function ElianaAdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    refreshSession().then(session => {
      if (!session) {
        router.push('/auth/login')
        return
      }
      if (!hasRole('owner') && !hasRole('admin') && !hasRole('superadmin')) {
        router.push('/')
        return
      }
      setAuthorized(true)
    })
  }, [router])

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center zafiro-page">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#197BD2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#657786] text-sm">Verificando acceso administrativo...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return <ElianaAdminDashboard />
}
