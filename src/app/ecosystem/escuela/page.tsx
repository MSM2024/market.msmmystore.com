'use client'

import Link from "next/link"
import { ArrowLeft, GraduationCap, BookOpen, Code2, Megaphone, Briefcase, Clock, Users, Star, Mail, Sparkles } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

const courses = [
  {
    icon: Briefcase,
    title: "Emprendimiento Digital",
    desc: "Aprende a crear, lanzar y escalar un negocio digital desde cero. Modelos de negocio, validación de ideas, estrategias de monetización y más.",
    modules: 12,
    duration: "8 semanas",
    level: "Principiante",
    color: "text-[#00D9FF]",
    topics: ["Modelo Canvas", "Validación de Mercado", "MVP y Productos Digitales", "Finanzas Básicas"],
  },
  {
    icon: Code2,
    title: "Programación y Desarrollo Web",
    desc: "Domina las tecnologías más demandadas: HTML, CSS, JavaScript, React y Next.js. Construye proyectos reales desde el primer día.",
    modules: 16,
    duration: "12 semanas",
    level: "Principiante - Intermedio",
    color: "text-emerald-400",
    topics: ["HTML & CSS", "JavaScript Moderno", "React & Next.js", "Bases de Datos"],
  },
  {
    icon: Megaphone,
    title: "Marketing Digital",
    desc: "Estrategias de crecimiento orgánico y pagado. SEO, redes sociales, email marketing, embudos de conversión y análisis de datos.",
    modules: 10,
    duration: "6 semanas",
    level: "Principiante - Avanzado",
    color: "text-purple-400",
    topics: ["SEO y Contenido", "Redes Sociales", "Email Marketing", "Embudos de Conversión"],
  },
  {
    icon: BookOpen,
    title: "Gestión de Negocios",
    desc: "Planificación estratégica, gestión de equipos, administración financiera y liderazgo para llevar tu empresa al siguiente nivel.",
    modules: 8,
    duration: "6 semanas",
    level: "Intermedio - Avanzado",
    color: "text-amber-400",
    topics: ["Planificación Estratégica", "Gestión de Equipos", "Finanzas Corporativas", "Liderazgo"],
  },
]

export default function EscuelaPage() {
  usePageTitle("Escuela MSM — Formación y Cursos")

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Escuela MSM</h1>
            <p className="text-sm text-slate-400">Formación y Cursos del Ecosistema MSM</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/60 glass-strong p-6 glow-border mb-8">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            <span className="text-amber-400 font-bold">Escuela MSM</span> es la plataforma de formación del ecosistema MSM.
            Diseñada para emprendedores, creadores y profesionales que quieren desarrollar habilidades
            prácticas para el mundo digital.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Cada curso está diseñado con un enfoque práctico: proyectos reales, mentores experimentados
            y una comunidad de aprendizaje que te acompaña en cada paso. Al completar un curso,
            obtienes un certificado verificado en ZAFIRO.
          </p>
        </div>

        {/* Courses */}
        <h2 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider mb-4">Cursos Disponibles</h2>
        <div className="space-y-4 mb-8">
          {courses.map((course, i) => {
            const Icon = course.icon
            return (
              <div key={i} className="rounded-2xl border border-slate-800/60 glass-strong p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full" />
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center shrink-0">
                      <Icon className={`w-6 h-6 ${course.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{course.title}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-400">
                          Próximamente
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{course.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="flex items-center gap-1 text-[9px] text-slate-500"><BookOpen className="w-3 h-3" /> {course.modules} módulos</span>
                    <span className="flex items-center gap-1 text-[9px] text-slate-500"><Clock className="w-3 h-3" /> {course.duration}</span>
                    <span className="flex items-center gap-1 text-[9px] text-slate-500"><Users className="w-3 h-3" /> {course.level}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.topics.map((topic, j) => (
                      <span key={j} className="px-2 py-1 rounded-lg bg-slate-800/40 border border-slate-700/30 text-[9px] text-slate-400">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Why Escuela MSM */}
        <h2 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider mb-4">Por Qué Escuela MSM</h2>
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: Sparkles, title: "Enfoque Práctico", desc: "Aprende haciendo con proyectos reales y casos de estudio." },
            { icon: Star, title: "Certificación ZAFIRO", desc: "Certificado verificado que se refleja en tu perfil de la red." },
            { icon: Users, title: "Comunidad Activa", desc: "Conecta con otros estudiantes, mentores y graduados." },
          ].map((b, i) => (
            <div key={i} className="p-4 rounded-2xl glass hover:border-slate-700 transition-all text-center">
              <b.icon className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <h3 className="text-[11px] font-bold text-white mb-1">{b.title}</h3>
              <p className="text-[9px] text-slate-400 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-500/10 to-[#00D9FF]/5 border border-amber-500/20 text-center mb-8">
          <GraduationCap className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-2">Registra tu Interés</h3>
          <p className="text-[11px] text-slate-400 mb-4 max-w-md mx-auto leading-relaxed">
            Sé de los primeros en acceder cuando Escuela MSM abra sus puertas.
            Los primeros registrados recibirán acceso anticipado y beneficios exclusivos.
          </p>
          <Link
            href="https://msmmystore.com/blog"
            target="_blank"
            className="inline-flex items-center gap-2 bg-amber-500 text-[#14171A] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-400 transition-colors"
          >
            <Mail className="w-4 h-4" /> Registrarme Ahora
          </Link>
        </div>

        <div className="text-center py-6 border-t border-slate-800">
          <p className="text-xs text-slate-500">Parte del <Link href="/ecosystem" className="text-amber-400 hover:underline">Ecosistema MSM</Link></p>
        </div>
      </div>
    </div>
  )
}
