'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ElianaAdminDashboard from '@/components/eliana/ElianaAdminDashboard'

export default function ElianaAdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    // Verificar que sea admin o superadmin
    const role = localStorage.getItem('zafiro_user_role') || 'customer'
    if (role !== 'admin' && role !== 'superadmin') {
      router.push('/')
      return
    }
    setAuthorized(true)
  }, [router])

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816]">
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
