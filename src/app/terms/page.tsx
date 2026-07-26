'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Shield, FileText, AlertCircle } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function TermsPage() {
  usePageTitle("Términos y Condiciones — ZAFIRO")

  const sections = [
    {
      title: "1. Aceptación de los Términos",
      content: "Al acceder y utilizar ZAFIRO (en adelante, 'la Plataforma'), aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte, no debes usar la Plataforma. ZAFIRO se reserva el derecho de modificar estos términos en cualquier momento, notificando a los usuarios mediante la publicación de la versión actualizada.",
    },
    {
      title: "2. Definiciones",
      content: "'ZAFIRO': Red Social del Conocimiento impulsada por Inteligencia Artificial. 'Usuario': toda persona que accede a la Plataforma. 'Creador': usuario que mantiene un perfil público con plataformas conectadas. 'ELIANA': sistema de inteligencia artificial que analiza y relaciona contenido. 'PTS': Puntos de Conocimiento, unidad de valor del sistema MSM Rewards. 'Mapa Vivo del Conocimiento': grafo inteligente que relaciona todo el contenido de la Plataforma. 'Universo Digital': conjunto de plataformas externas conectadas por un usuario.",
    },
    {
      title: "3. Uso de la Plataforma",
      content: "ZAFIRO permite: (a) realizar preguntas y publicar respuestas; (b) conectar plataformas externas (redes sociales, canales, sitios web, aplicaciones) a un perfil unificado; (c) participar en Círculos y comunidades; (d) ganar PTS y acceder a membresías premium; (e) utilizar ELIANA para análisis de contenido. El usuario se compromete a no utilizar la Plataforma para actividades ilícitas, difundir desinformación, acosar a otros usuarios o violar derechos de propiedad intelectual.",
    },
    {
      title: "4. Conexión de Plataformas Externas",
      content: "ZAFIRO permite conectar enlaces públicos a plataformas externas (YouTube, Instagram, TikTok, Facebook, X, Telegram, WhatsApp, GitHub, blogs, sitios web, tiendas, etc.). Al conectar una plataforma, el creador autoriza explícitamente la visualización de vista previa de su contenido en ZAFIRO. ZAFIRO NO almacena el contenido original de dichas plataformas. Solo guarda metadatos (título, descripción, URL) y resúmenes generados por ELIANA. Las vistas previas se generan utilizando las capacidades permitidas por cada plataforma y sus APIs oficiales. Cada plataforma origen (YouTube, Instagram, etc.) conserva sus propias políticas de derechos de autor y es responsable de gestionar cualquier infracción. El creador es responsable del contenido que publica en sus propias plataformas.",
    },
    {
      title: "5. Propiedad Intelectual",
      content: "El contenido generado por los usuarios (preguntas, respuestas, comentarios) es propiedad de sus autores, quienes otorgan a ZAFIRO una licencia no exclusiva para mostrar, organizar y promover dicho contenido dentro de la Plataforma. Los metadatos y resúmenes generados por ELIANA son propiedad de ZAFIRO. El contenido original alojado en plataformas externas permanece bajo los términos de dichas plataformas.",
    },
    {
      title: "6. Automatización e Inteligencia Artificial",
      content: "ZAFIRO utiliza inteligencia artificial (ELIANA) para automatizar múltiples procesos de la plataforma: registro y verificación de usuarios, gestión de membresías, procesamiento de pagos a través de Stripe, renovaciones, cancelaciones, sistema de referidos, acreditación de PTS, moderación inicial de contenido, detección de spam y fraude, notificaciones, recomendaciones personalizadas y soporte básico. Los usuarios aceptan que ciertas decisiones de la plataforma pueden ser tomadas automáticamente por ELIANA. Las decisiones que requieren juicio humano complejo (disputas, apelaciones, bloqueos de cuenta, asuntos legales) serán escaladas a revisión humana. ZAFIRO se reserva el derecho de mejorar y actualizar sus sistemas de automatización sin previo aviso.",
    },
    {
      title: "7. Sistema MSM Rewards y PTS",
      content: "Los PTS (Puntos de Conocimiento) se otorgan por contribuciones valiosas. No tienen valor monetario real ni son transferibles fuera de la Plataforma. ZAFIRO se reserva el derecho de ajustar las tasas de PTS, los niveles y los beneficios asociados. Los PTS obtenidos mediante fraude o violación de estos términos serán revocados.",
    },
    {
      title: "8. Membresías Pro y Cuba Plus",
      content: "Las membresías premium son servicios de suscripción que ofrecen funcionalidades adicionales. Los pagos se procesan a través de Stripe. Las membresías se renuevan automáticamente a menos que se cancelen antes de la fecha de facturación. No se ofrecen reembolsos por períodos parciales. ZAFIRO puede modificar los precios con aviso previo de 30 días.",
    },
    {
      title: "9. Sistema de Referidos",
      content: "Los usuarios pueden compartir enlaces de referido únicos. Las bonificaciones por referido se acreditan en PTS cuando el nuevo usuario completa su registro. Los términos del programa de referidos pueden ser modificados en cualquier momento.",
    },
    {
      title: "10. Sponsors y Publicidad",
      content: "Los Sponsors son marcas o creadores que patrocinan contenido dentro de ZAFIRO. Las relaciones comerciales entre Sponsors y ZAFIRO se rigen por acuerdos separados. ZAFIRO se reserva el derecho de rechazar o eliminar cualquier contenido patrocinado que considere inapropiado.",
    },
    {
      title: "11. Privacidad y Datos",
      content: "El tratamiento de datos personales se rige por nuestra Política de Privacidad. ZAFIRO implementa medidas de seguridad técnicas y organizativas para proteger la información de los usuarios. No compartimos datos personales con terceros sin consentimiento explícito, excepto cuando sea requerido por ley.",
    },
    {
      title: "12. Moderación y Conducta",
      content: "ZAFIRO combina moderación por IA (ELIANA) y revisión humana. Los usuarios deben seguir las Reglas de la Comunidad. Las infracciones pueden resultar en: advertencia, suspensión temporal, pérdida de PTS, o eliminación permanente de la cuenta. ZAFIRO se reserva el derecho de eliminar contenido que viole estos términos sin previo aviso.",
    },
    {
      title: "13. Limitación de Responsabilidad",
      content: "ZAFIRO se proporciona 'tal cual', sin garantías de disponibilidad continua, precisión del contenido o idoneidad para un propósito particular. ZAFIRO no es responsable por daños directos o indirectos derivados del uso de la Plataforma, incluyendo pero no limitado a: pérdida de datos, interrupción del servicio, o acciones de otros usuarios.",
    },
    {
      title: "14. Modificaciones",
      content: "ZAFIRO se reserva el derecho de modificar, suspender o descontinuar cualquier aspecto de la Plataforma en cualquier momento. Los usuarios serán notificados de cambios significativos mediante aviso en la Plataforma o correo electrónico.",
    },
    {
      title: "15. Ley Aplicable",
      content: "Estos términos se rigen por las leyes de España. Cualquier disputa será resuelta en los tribunales de Madrid, España.",
    },
    {
      title: "16. Contacto",
      content: "Para consultas sobre estos términos, contáctanos en: support@msmmystore.com o a través del formulario de contacto en /contact.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Términos y Condiciones</h1>
            <p className="text-sm text-slate-400">Última actualización: Julio 2026</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-6">
          <p className="text-xs text-slate-400 leading-relaxed">
            Estos términos rigen el uso de ZAFIRO, la primera Red Social del Conocimiento impulsada por Inteligencia Artificial. 
            Al utilizar la plataforma, aceptas estos términos en su totalidad. Te recomendamos leerlos detenidamente.
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={i} className="p-5 rounded-2xl glass">
              <h2 className="text-sm font-bold text-white mb-2">{s.title}</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-500">
          <p>Parte del <Link href="/ecosystem" className="text-[#00D9FF] hover:underline">Ecosistema MSM</Link></p>
        </div>
      </div>
    </div>
  )
}
