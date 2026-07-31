"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { getSession, loginUser, logout, refreshSession, getUserRole, hasRole, type ZafiroSession, type UserRole } from "@/lib/auth"

interface AuthContextValue {
  session: ZafiroSession | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<{ ok: boolean; error?: string; code?: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  userRole: UserRole
  hasRole: (role: UserRole) => boolean
  isAdmin: boolean
  isOwner: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ZafiroSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const s = getSession()
    if (s) Promise.resolve().then(() => setSession(s))

    refreshSession()
      .then((fresh) => {
        if (fresh) setSession(fresh)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    const result = await loginUser(email, password)
    if (result.ok && result.session) {
      setSession(result.session)
    }
    if (!result.ok && result.error) {
      setError(result.error)
    }
    return result
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, referralCode?: string) => {
    setError(null)
    const { registerUser } = await import("@/lib/auth")
    const result = await registerUser(name, email, password, referralCode)
    if (result.ok && result.autoConfirmed) {
      const s = getSession()
      if (s) setSession(s)
    }
    if (!result.ok && result.error) {
      setError(result.error)
    }
    return result
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    setSession(null)
    setError(null)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    const s = await refreshSession()
    setSession(s)
    setLoading(false)
  }, [])

  const userRole = session ? getUserRole() : "customer"
  const isAdmin = hasRole("admin") || hasRole("superadmin") || hasRole("owner")
  const isOwner = hasRole("owner")

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        error,
        login,
        register,
        logout: handleLogout,
        refresh,
        userRole,
        hasRole,
        isAdmin,
        isOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
