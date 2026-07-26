'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Brain, Users, Award, Globe, Shield, Star, MessageSquare, BookOpen, CreditCard, Zap, Sparkles, HelpCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function HelpPage() {
  usePageTitle("Centro de Ayuda — ZAFIRO")

  const faqs = [
    {
      q: "¿Qué es ZAFIRO?",
      a: "ZAFIRO es la primera Red Social del Conocimiento impulsada por Inteligencia Artificial. Es una plataforma donde los usuarios pueden hacer preguntas, obtener respuestas de la comunidad y de ELIANA (nuestra IA), conectar sus redes sociales y proyectos en un perfil unificado, y construir su reputación digital a través del sistema MSM Rewards.",
    },
    {
      q: "¿Cómo funciona el Mapa Vivo del Conocimiento?",
      a: "El Mapa Vivo del Conocimiento es un grafo inteligente que relaciona preguntas, respuestas, plataformas conectadas, expertos y comunidades. Cada contenido que se añade a ZAFIRO es analizado por ELIANA, que extrae conceptos clave y los conecta con conocimiento existente. Esto permite descubrir relaciones que no son obvias: una pregunta sobre criptografía puede conectarse con un canal de YouTube, un artículo de blog y un experto en la comunidad.",
    },
    {
      q: "¿Cómo funciona ELIANA?",
      a: "ELIANA (Engine for Learning, Intelligence and Advanced Knowledge Analysis) es el motor de IA de ZAFIRO. Analiza preguntas, respuestas y plataformas conectadas para generar resúmenes, extraer conceptos clave, categorizar contenido y descubrir conexiones en el Mapa Vivo del Conocimiento. Puedes preguntar a ELIANA sobre cualquier contenido en ZAFIRO o sobre las plataformas que has conectado a tu perfil.",
    },
    {
      q: "¿Qué procesos automatiza ELIANA?",
      a: "ELIANA automatiza la mayoría de los procesos de la plataforma: registro y verificación de nuevos usuarios, onboarding, gestión de membresías Pro y Cuba Plus, pagos con Stripe, renovaciones y cancelaciones, sistema de referidos, acreditación de MSM Rewards (PTS), moderación inicial de contenido, detección de spam y fraude, notificaciones, recomendaciones personalizadas y soporte básico. Solo los casos sensibles (fraude complejo, disputas, apelaciones, bloqueos de cuenta, asuntos legales) se escalan a revisión humana. Esto permite que ZAFIRO opere de forma eficiente y responda instantáneamente a la mayoría de las solicitudes.",
    },
    {
      q: "¿Qué es Mi Universo Digital?",
      a: "Mi Universo Digital es el panel donde puedes conectar todas tus redes sociales, canales, aplicaciones y proyectos. Soporta 21 tipos de plataforma: YouTube, Instagram, TikTok, X (Twitter), Facebook, LinkedIn, Telegram, WhatsApp, Google, Google Drive, blogs, podcasts, GitHub, websites, tiendas, apps, Pinterest, Venmo, Trustpilot, email y otras. Cada plataforma se puede editar, reordenar, activar/desactivar y eliminar. Las plataformas activas aparecen en tu perfil público con vista previa.",
    },
    {
      q: "¿Cómo funciona el Perfil del Creador?",
      a: "Cada usuario tiene un perfil público en /perfil/[username] que muestra: su ecosistema de proyectos, las plataformas conectadas (solo las activas), publicaciones recientes, estadísticas (racha, PTS, logros, seguidores), análisis de ELIANA sobre su perfil completo, y acciones como seguir, enviar mensaje o preguntar a ELIANA.",
    },
    {
      q: "¿Cómo se conectan las redes sociales?",
      a: "Desde el panel Mi Universo Digital (/universo) puedes agregar cualquier plataforma pública. Al conectar tu plataforma, autorizas explícitamente la vista previa de tu contenido en ZAFIRO. ZAFIRO no almacena el contenido original de YouTube, Instagram, Facebook, TikTok, etc. En su lugar, guarda el enlace, metadatos y un resumen generado por ELIANA. Las vistas previas se generan usando APIs oficiales. Cada plataforma origen gestiona sus propias políticas de derechos de autor. Si alguien conecta contenido que no le pertenece, la plataforma origen (YouTube, etc.) lo elimina según sus términos.",
    },
    {
      q: "¿Cómo gano PTS y subo de nivel?",
      a: "Ganas PTS (Puntos de Conocimiento) por: crear preguntas, responder preguntas, conectar plataformas a tu perfil, recibir votos positivos, mantener rachas de actividad diaria, invitar amigos (sistema de referidos), participar en Círculos, y contribuir a la comunidad. Los PTS determinan tu nivel y desbloquean beneficios en membresías Pro y Cuba Plus.",
    },
    {
      q: "¿Cómo funcionan las membresías?",
      a: "ZAFIRO es gratuito. Las membresías Pro y Cuba Plus son servicios premium que ofrecen: análisis ELIANA ilimitados, almacenamiento de más plataformas, estadísticas avanzadas, soporte prioritario, insignias exclusivas, y beneficios en el ecosistema MSM. Cuba Plus incluye además herramientas específicas para la comunidad cubana: remesas, envíos y conexiones.",
    },
    {
      q: "¿Cómo funciona el sistema de referidos?",
      a: "Comparte tu enlace de referido único con amigos y conocidos. Cuando alguien se registra a través de tu enlace, tanto tú como la nueva persona reciben PTS de bonificación. Si el referido se convierte en miembro Pro, recibes un porcentaje de sus PTS durante los primeros meses.",
    },
    {
      q: "¿Cómo funcionan los Círculos?",
      a: "Los Círculos son comunidades temáticas donde expertos y aprendices colaboran. Cada Círculo tiene un tema específico (criptografía, IA, remesas, etc.), un líder, reglas propias y un sistema de reputación interno. Puedes unirte a Círculos existentes o crear el tuyo propio si tienes el nivel suficiente.",
    },
    {
      q: "¿Cómo funcionan los Sponsors?",
      a: "Los Sponsors son marcas, creadores o proyectos que patrocinan contenido, Círculos o eventos dentro de ZAFIRO. A cambio, reciben visibilidad, acceso a audiencias especializadas y análisis de impacto. Cualquier usuario o marca puede convertirse en Sponsor a través del panel de Sponsors.",
    },
    {
      q: "¿Qué es Cuba Plus?",
      a: "Cuba Plus es una membresía premium diseñada específicamente para la comunidad cubana. Incluye: herramientas de envío de remesas, conexión con servicios de envío a Cuba, contenido sobre oportunidades para cubanos, descuentos en MSM My Store para envíos a Cuba, y una red de contactos verificados.",
    },
    {
      q: "¿Cómo se protege mi privacidad?",
      a: "ZAFIRO no almacena contenido original de plataformas de terceros. Solo guardamos metadatos (título, descripción, URL) y resúmenes generados por ELIANA. No compartimos datos personales sin consentimiento. Las plataformas conectadas tienen control de visibilidad (puedes activarlas/desactivarlas). Usamos cifrado en tránsito y en reposo. Consulta nuestra Política de Privacidad para más detalles.",
    },
    {
      q: "¿Cómo funciona la moderación?",
      a: "La moderación combina inteligencia artificial (ELIANA detecta contenido potencialmente problemático) con revisión humana de la comunidad. Los usuarios pueden reportar contenido. Las infracciones a las Reglas de la Comunidad resultan en advertencias, suspensión temporal o eliminación permanente según la gravedad y reincidencia.",
    },
    {
      q: "¿Cómo se utilizan la IA y las contribuciones humanas?",
      a: "ELIANA analiza y relaciona contenido automáticamente, pero la comunidad humana es quien genera las preguntas, respuestas y debates. La IA complementa, no reemplaza. Los análisis de ELIANA son transparentes y la comunidad puede votarlos, corregirlos y enriquecerlos. Esta sinergia produce conocimiento más confiable que el que podría generar la IA o los humanos por separado.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Centro de Ayuda</h1>
            <p className="text-sm text-slate-400">Todo lo que necesitas saber sobre ZAFIRO</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            ZAFIRO es la primera Red Social del Conocimiento impulsada por Inteligencia Artificial. 
            Aquí encontrarás respuestas a las preguntas más frecuentes sobre la plataforma, sus funciones 
            y su filosofía. <span className="text-white font-bold">Todo comienza con un pensamiento</span>.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-2xl glass overflow-hidden">
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/20 transition-colors list-none">
                <span className="w-6 h-6 rounded-lg bg-slate-800/60 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-[#00D9FF]">{i + 1}</span>
                </span>
                <span className="text-xs font-bold text-white flex-1">{faq.q}</span>
                <span className="text-slate-500 group-open:rotate-180 transition-transform text-sm">▼</span>
              </summary>
              <div className="px-4 pb-4 pt-1 border-t border-slate-800/40">
                <p className="text-[11px] text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-2xl glass text-center">
          <p className="text-xs text-slate-400 mb-3">¿No encuentras lo que buscas?</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all">
            Contactar soporte
          </Link>
        </div>
      </div>
    </div>
  )
}
