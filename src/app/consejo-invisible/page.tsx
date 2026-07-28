'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import InvisibleCouncilDashboard from '@/components/consejo-invisible/InvisibleCouncilDashboard'

export default function ConsejoInvisiblePage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    // Por ahora, cualquier usuario autenticado puede acceder.
    // Cuando Supabase esté configurado, verificar role OWNER_SUPERADMIN.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthorized(true)
  }, [router])

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#657786] text-sm">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return <InvisibleCouncilDashboard />
}
