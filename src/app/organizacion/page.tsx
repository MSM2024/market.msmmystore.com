"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, Loader2, Plus, UserPlus, XCircle, Check, AlertTriangle, Shield, User, Crown, RefreshCw, Home } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { refreshSession } from "@/lib/auth"

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  manager: "Gerente",
  member: "Miembro",
  viewer: "Invitado",
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  manager: UserPlus,
  member: User,
  viewer: User,
}

interface Org {
  membership_id: string
  role: string
  status: string
  id: string
  name: string
  slug: string
  type: string
  owner_id: string
  created_at: string
}

interface Member {
  id: string
  user_id: string
  role: string
  status: string
  email: string
  name: string
  is_self: boolean
}

type PageStatus = "loading" | "ready" | "unauthorized" | "error"

export default function OrganizationPage() {
  usePageTitle("Organización")
  const router = useRouter()

  const [status, setStatus] = useState<PageStatus>("loading")
  const [orgs, setOrgs] = useState<Org[]>([])
  const [activeOrgId, setActiveOrgId] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const [createName, setCreateName] = useState("")
  const [createType, setCreateType] = useState("business")
  const [creating, setCreating] = useState(false)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviting, setInviting] = useState(false)

  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadOrgs = useCallback(async () => {
    const res = await fetch("/api/organizations", { credentials: "include", cache: "no-store" })
    if (!res.ok) throw new Error("REQUEST_FAILED")
    const data = (await res.json()) as { organizations?: Org[] }
    return data.organizations || []
  }, [])

  const loadMembers = useCallback(async (orgId: string) => {
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/organizations/members?org=${encodeURIComponent(orgId)}`, {
        credentials: "include",
        cache: "no-store",
      })
      if (res.status === 403) {
        setMembers([])
        return
      }
      if (!res.ok) {
        setMembers([])
        return
      }
      const data = (await res.json()) as { members?: Member[] }
      setMembers(data.members || [])
    } catch {
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const session = await refreshSession()
      if (!session) {
        if (!cancelled) {
          setStatus("unauthorized")
          router.replace("/auth/login")
        }
        return
      }
      try {
        const list = await loadOrgs()
        if (cancelled) return
        setOrgs(list)
        if (list.length > 0) {
          setActiveOrgId(list[0].id)
          void loadMembers(list[0].id)
        }
        setStatus("ready")
      } catch {
        if (!cancelled) setStatus("error")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, loadOrgs, loadMembers])

  const activeOrg = useMemo(() => orgs.find((o) => o.id === activeOrgId) || null, [orgs, activeOrgId])
  const isOwnerOrAdmin = !!activeOrg && ["owner", "admin"].includes(activeOrg.role)

  const selectOrg = (orgId: string) => {
    setActiveOrgId(orgId)
    setMessage(null)
    void loadMembers(orgId)
  }

  const handleCreate = async () => {
    if (!createName.trim()) return
    setCreating(true)
    setMessage(null)
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: createName, type: createType }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string; organization?: Org } | null
      if (!res.ok || !data?.organization) {
        setMessage({ ok: false, text: data?.error || "No se pudo crear la organización" })
        return
      }
      const list = await loadOrgs()
      setOrgs(list)
      setActiveOrgId(data.organization.id)
      void loadMembers(data.organization.id)
      setCreateName("")
      setMessage({ ok: true, text: "Organización creada" })
    } catch {
      setMessage({ ok: false, text: "No se pudo crear la organización" })
    } finally {
      setCreating(false)
    }
  }

  const handleInvite = async () => {
    if (!activeOrg || !inviteEmail.trim()) return
    setInviting(true)
    setMessage(null)
    try {
      const res = await fetch("/api/organizations/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ organization_id: activeOrg.id, email: inviteEmail, role: inviteRole }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setMessage({ ok: false, text: data?.error || "No se pudo invitar" })
        return
      }
      setInviteEmail("")
      setMessage({ ok: true, text: "Miembro agregado" })
      void loadMembers(activeOrg.id)
    } catch {
      setMessage({ ok: false, text: "No se pudo invitar" })
    } finally {
      setInviting(false)
    }
  }

  const changeRole = async (membershipId: string, role: string) => {
    if (!activeOrg) return
    setBusyId(membershipId)
    setMessage(null)
    try {
      const res = await fetch("/api/organizations/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ membership_id: membershipId, role }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setMessage({ ok: false, text: data?.error || "No se pudo cambiar el rol" })
      } else {
        setMessage({ ok: true, text: "Rol actualizado" })
        void loadMembers(activeOrg.id)
      }
    } catch {
      setMessage({ ok: false, text: "No se pudo cambiar el rol" })
    } finally {
      setBusyId(null)
    }
  }

  const removeMember = async (membershipId: string) => {
    if (!activeOrg) return
    setBusyId(membershipId)
    setMessage(null)
    try {
      const res = await fetch("/api/organizations/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ membership_id: membershipId }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setMessage({ ok: false, text: data?.error || "No se pudo eliminar el miembro" })
      } else {
        setMessage({ ok: true, text: "Miembro eliminado" })
        void loadMembers(activeOrg.id)
      }
    } catch {
      setMessage({ ok: false, text: "No se pudo eliminar el miembro" })
    } finally {
      setBusyId(null)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen zafiro-page flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" />
      </div>
    )
  }

  if (status === "unauthorized") return null

  if (status === "error") {
    return (
      <div className="min-h-screen zafiro-page text-white flex items-center justify-center">
        <div className="text-center max-w-xs">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <p className="text-sm text-slate-300 mb-1">No pudimos cargar tus organizaciones</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setStatus("loading"); void (async () => { await refreshSession(); setStatus("ready") })() }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Reintentar
            </button>
            <button onClick={() => router.replace("/")}
              className="px-4 py-2 rounded-xl bg-slate-800/60 text-slate-300 text-xs font-bold cursor-pointer border border-slate-700/50 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> Inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/settings" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Configuración
        </Link>
        <h1 className="text-2xl font-black mb-1 flex items-center gap-3">
          <Building2 className="w-6 h-6 text-[#00D9FF]" /> Organización
        </h1>
        <p className="text-xs text-slate-400 mb-8">Equipos y permisos dentro de tu espacio en ZAFIRO</p>

        {orgs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {orgs.map((o) => (
              <button key={o.id} onClick={() => selectOrg(o.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  o.id === activeOrgId
                    ? "bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/30"
                    : "bg-slate-900/40 text-slate-400 border border-slate-800 hover:text-white"
                }`}>
                {o.name}
              </button>
            ))}
          </div>
        )}

        {activeOrg ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl glass border border-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00D9FF]/20 to-blue-600/10 border border-[#00D9FF]/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#00D9FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black">{activeOrg.name}</p>
                  <p className="text-[10px] text-slate-500">@{activeOrg.slug} · {ROLE_LABELS[activeOrg.role] || activeOrg.role}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">
                  {members.length} miembros
                </span>
              </div>
            </div>

            {isOwnerOrAdmin && (
              <div className="p-5 rounded-2xl glass border border-slate-800/30 space-y-4">
                <h2 className="text-sm font-black flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#00D9FF]" /> Invitar miembro
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none"
                  />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#00D9FF] outline-none cursor-pointer">
                    {Object.entries(ROLE_LABELS).filter(([r]) => r !== "owner").map(([r, label]) => (
                      <option key={r} value={r}>{label}</option>
                    ))}
                  </select>
                  <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                    {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Agregar
                  </button>
                </div>
                <p className="text-[9px] text-slate-500">El correo debe pertenecer a una cuenta registrada en ZAFIRO.</p>
              </div>
            )}

            <div className="p-5 rounded-2xl glass border border-slate-800/30">
              <h2 className="text-sm font-black mb-4">Miembros</h2>
              {membersLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando miembros...
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">Sin miembros que mostrar.</div>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => {
                    const RoleIcon = ROLE_ICONS[m.role] || User
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/20 border border-slate-800/60">
                        <div className="w-9 h-9 rounded-full bg-[#00D9FF]/10 flex items-center justify-center shrink-0">
                          <RoleIcon className="w-4 h-4 text-[#00D9FF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">
                            {m.name || m.email}
                            {m.is_self && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/25">TÚ</span>}
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">{m.email}</p>
                        </div>
                        {isOwnerOrAdmin && m.role !== "owner" ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <select value={m.role}
                              onChange={(e) => changeRole(m.id, e.target.value)}
                              disabled={busyId === m.id}
                              className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-[#00D9FF] outline-none cursor-pointer disabled:opacity-50">
                              {Object.entries(ROLE_LABELS).filter(([r]) => r !== "owner").map(([r, label]) => (
                                <option key={r} value={r}>{label}</option>
                              ))}
                            </select>
                            <button onClick={() => removeMember(m.id)} disabled={busyId === m.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-red-400 border border-slate-700/60 hover:border-red-500/30 cursor-pointer disabled:opacity-50">
                              {busyId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Quitar
                            </button>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-700/60 shrink-0">
                            {ROLE_LABELS[m.role] || m.role}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl glass border border-slate-800/30 space-y-5">
            <div className="text-center">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h2 className="text-sm font-black">Crea tu primera organización</h2>
              <p className="text-[10px] text-slate-500 mt-1">Agrupa a tu equipo con roles y permisos compartidos.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Nombre de la organización</label>
                <input
                  type="text"
                  placeholder="Ej. Mi Editorial"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00D9FF] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Tipo</label>
                <select value={createType} onChange={(e) => setCreateType(e.target.value)}
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#00D9FF] outline-none cursor-pointer">
                  <option value="business">Negocio</option>
                  <option value="admin">Administrativa</option>
                  <option value="platform">Plataforma</option>
                </select>
              </div>
              <button onClick={handleCreate} disabled={creating || !createName.trim()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Crear organización
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-[10px] font-bold ${
            message.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-300"
          }`}>
            {message.ok ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
