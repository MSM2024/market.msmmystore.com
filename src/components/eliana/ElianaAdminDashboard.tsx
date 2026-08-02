'use client'

import { useState, useEffect } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import {
  getAllKnowledge,
  createKnowledge,
  approveKnowledge,
  publishKnowledge,
  archiveKnowledge,
  getKnowledgeStats,
  migrateFromStaticKnowledge
} from '@/lib/eliana/core/knowledge'
import { getConversationStats } from '@/lib/eliana/core/conversation'
import type { ElianaKnowledge } from '@/lib/eliana/core/types'
import { KNOWLEDGE_CATEGORIES } from '@/lib/eliana/core/types'

export default function ElianaAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'conversations' | 'handoffs' | 'settings'>('overview')
  const [knowledge, setKnowledge] = useState<ElianaKnowledge[]>([])
  const [kStats, setKStats] = useState({ total: 0, published: 0, draft: 0, pending: 0, archived: 0, categories: 0 })
  const [cStats, setCStats] = useState({ total_conversations: 0, active_conversations: 0, resolved_today: 0, total_messages: 0, messages_today: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDoc, setNewDoc] = useState({ category: 'general_info', title: '', content: '', source: '', tags: '' })

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setKnowledge(getAllKnowledge())
    setKStats(getKnowledgeStats())
    setCStats(getConversationStats())
    migrateFromStaticKnowledge()
  }

  function handleCreate() {
    if (!newDoc.title || !newDoc.content) return
    createKnowledge({
      category: newDoc.category,
      title: newDoc.title,
      content: newDoc.content,
      source: newDoc.source || 'admin',
      status: 'draft',
      priority: 5,
      requires_human_review: false,
      tags: newDoc.tags.split(',').map(t => t.trim()).filter(Boolean),
      channel: 'all'
    })
    setNewDoc({ category: 'general_info', title: '', content: '', source: '', tags: '' })
    setShowCreateModal(false)
    loadData()
  }

  function handleApprove(id: string) {
    approveKnowledge(id, 'admin')
    loadData()
  }

  function handlePublish(id: string) {
    publishKnowledge(id)
    loadData()
  }

  function handleArchive(id: string) {
    archiveKnowledge(id)
    loadData()
  }

  return (
    <div className="min-h-screen zafiro-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#197BD2] text-xs font-medium uppercase tracking-wider">Admin Panel</p>
          <h1 className="text-3xl font-bold text-white mt-1">ELIANA — Centro de Control</h1>
          <p className="text-[#657786] text-sm mt-2">Gestión de conocimiento, canales y conversaciones</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['overview', 'knowledge', 'conversations', 'handoffs', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-[#197BD2] text-white'
                  : 'bg-[#14171A] text-[#657786] hover:text-white'
              }`}
            >
              {tab === 'overview' && '📊 Resumen'}
              {tab === 'knowledge' && '📚 Conocimiento'}
              {tab === 'conversations' && '💬 Conversaciones'}
              {tab === 'handoffs' && '🚨 Escalados'}
              {tab === 'settings' && '⚙️ Configuración'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-[#197BD2]">{kStats.total}</p>
              <p className="text-[#657786] text-xs mt-1">Docs de Conocimiento</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{kStats.published}</p>
              <p className="text-[#657786] text-xs mt-1">Publicados</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-[#D4AF37]">{cStats.active_conversations}</p>
              <p className="text-[#657786] text-xs mt-1">Conversaciones Activas</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-[#7c3aed]">{cStats.total_messages}</p>
              <p className="text-[#657786] text-xs mt-1">Mensajes Totales</p>
            </GlassCard>
          </div>
        )}

        {/* Knowledge Tab */}
        {activeTab === 'knowledge' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Base de Conocimiento</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg bg-[#197BD2] text-white text-sm font-medium hover:bg-[#197BD2]/80"
              >
                + Nuevo Documento
              </button>
            </div>

            <div className="space-y-3">
              {knowledge.map(doc => (
                <GlassCard key={doc.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-[#0C3F6A]/40 text-[#197BD2]">{doc.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          doc.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                          doc.status === 'approved' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                          doc.status === 'draft' ? 'bg-[#657786]/20 text-[#657786]' :
                          'bg-[#7c3aed]/20 text-[#7c3aed]'
                        }`}>
                          {doc.status}
                        </span>
                        <span className="text-[#657786] text-xs">v{doc.version}</span>
                      </div>
                      <h3 className="text-white font-medium text-sm">{doc.title}</h3>
                      <p className="text-[#657786] text-xs mt-1 line-clamp-2">{doc.content.slice(0, 150)}...</p>
                      <div className="flex gap-1 mt-2">
                        {doc.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-[#14171A] text-[#657786]">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {doc.status === 'draft' && (
                        <button onClick={() => handleApprove(doc.id)} className="text-xs px-2 py-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30">
                          Aprobar
                        </button>
                      )}
                      {doc.status === 'approved' && (
                        <button onClick={() => handlePublish(doc.id)} className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                          Publicar
                        </button>
                      )}
                      {doc.status === 'published' && (
                        <button onClick={() => handleArchive(doc.id)} className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                          Archivar
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
              {knowledge.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[#657786]">No hay documentos de conocimiento aún.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Conversaciones Activas</h2>
            <GlassCard className="p-6">
              <p className="text-[#657786] text-sm">
                Las conversaciones se muestran aquí cuando Supabase esté configurado.
                Actualmente opera en modo localStorage.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#D4AF37]">{cStats.active_conversations}</p>
                  <p className="text-[#657786] text-xs">Activas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{cStats.resolved_today}</p>
                  <p className="text-[#657786] text-xs">Resueltas Hoy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#197BD2]">{cStats.messages_today}</p>
                  <p className="text-[#657786] text-xs">Mensajes Hoy</p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Handoffs Tab */}
        {activeTab === 'handoffs' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Escalados Pendientes</h2>
            <GlassCard className="p-6">
              <p className="text-[#657786] text-sm">
                Los escalados humanos aparecerán aquí cuando haya conversaciones que requieran atención humana.
              </p>
            </GlassCard>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Configuración de ELIANA</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-4">
                <h3 className="text-white font-medium mb-2">Canales</h3>
                <div className="space-y-2">
                  {['web', 'whatsapp', 'marketplace', 'zafiro', 'eliana_domain'].map(ch => (
                    <div key={ch} className="flex items-center justify-between">
                      <span className="text-[#E6E7E8] text-sm capitalize">{ch.replace('_', ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${ch === 'whatsapp' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {ch === 'whatsapp' ? 'Pendiente' : 'Activo'}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="p-4">
                <h3 className="text-white font-medium mb-2">Modelo de IA</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#657786]">Modelo</span>
                    <span className="text-[#E6E7E8]">Gemini 1.5 Flash</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#657786]">Temperature</span>
                    <span className="text-[#E6E7E8]">0.7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#657786]">Max Tokens</span>
                    <span className="text-[#E6E7E8]">800</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-lg p-6">
              <h3 className="text-white font-bold text-lg mb-4">Nuevo Documento de Conocimiento</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[#657786] text-xs block mb-1">Categoría</label>
                  <select
                    value={newDoc.category}
                    onChange={e => setNewDoc({ ...newDoc, category: e.target.value })}
                    className="w-full bg-[#14171A] border border-[#1a1f2e] rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {KNOWLEDGE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#657786] text-xs block mb-1">Título</label>
                  <input
                    value={newDoc.title}
                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                    className="w-full bg-[#14171A] border border-[#1a1f2e] rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Título del documento"
                  />
                </div>
                <div>
                  <label className="text-[#657786] text-xs block mb-1">Contenido</label>
                  <textarea
                    value={newDoc.content}
                    onChange={e => setNewDoc({ ...newDoc, content: e.target.value })}
                    className="w-full bg-[#14171A] border border-[#1a1f2e] rounded-lg px-3 py-2 text-white text-sm h-32 resize-none"
                    placeholder="Contenido del documento..."
                  />
                </div>
                <div>
                  <label className="text-[#657786] text-xs block mb-1">Fuente</label>
                  <input
                    value={newDoc.source}
                    onChange={e => setNewDoc({ ...newDoc, source: e.target.value })}
                    className="w-full bg-[#14171A] border border-[#1a1f2e] rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Ej: manual, FAQ, política"
                  />
                </div>
                <div>
                  <label className="text-[#657786] text-xs block mb-1">Etiquetas (separadas por coma)</label>
                  <input
                    value={newDoc.tags}
                    onChange={e => setNewDoc({ ...newDoc, tags: e.target.value })}
                    className="w-full bg-[#14171A] border border-[#1a1f2e] rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="producto, precio, servicio"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-lg bg-[#14171A] text-[#657786] text-sm">
                  Cancelar
                </button>
                <button onClick={handleCreate} className="flex-1 py-2 rounded-lg bg-[#197BD2] text-white text-sm font-medium">
                  Crear
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  )
}
