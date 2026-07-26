'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Shield, Lock, Eye, Database } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function PrivacyPage() {
  usePageTitle("Política de Privacidad — ZAFIRO")

  const sections = [
    {
      title: "1. Datos que Recopilamos",
      content: [
        "Información de registro: nombre de usuario, correo electrónico y contraseña cifrada.",
        "Información de perfil: foto, biografía, ubicación y enlaces a plataformas externas que el usuario decida agregar voluntariamente.",
        "Contenido generado: preguntas, respuestas, comentarios y publicaciones realizadas en la Plataforma.",
        "Metadatos de plataformas conectadas: títulos, descripciones, URLs públicas e imágenes de previsualización obtenidas mediante APIs oficiales.",
        "Datos de uso: páginas visitadas, tiempo de sesión, interacciones y preferencias.",
        "Datos de pago: procesados exclusivamente por Stripe. ZAFIRO no almacena números de tarjeta ni datos bancarios.",
      ],
    },
    {
      title: "2. Cómo Usamos tus Datos",
      content: [
        "Operar y mantener la Plataforma, incluyendo la generación de resúmenes por ELIANA.",
        "Personalizar la experiencia: recomendaciones de contenido, círculos y conexiones relevantes.",
        "Calcular y acreditar PTS en el sistema MSM Rewards.",
        "Automatizar procesos de la plataforma: registro, verificación, membresías, pagos, soporte, moderación y detección de fraude mediante ELIANA.",
        "Mejorar ELIANA y el Mapa Vivo del Conocimiento mediante análisis agregados y anonimizados.",
        "Comunicaciones relacionadas con el servicio: notificaciones, actualizaciones y soporte.",
        "Cumplir con obligaciones legales y regulatorias.",
      ],
    },
    {
      title: "3. Almacenamiento y Seguridad",
      content: [
        "Los datos se almacenan en servidores seguros con cifrado en tránsito (TLS) y en reposo.",
        "Las contraseñas se almacenan usando hashbcrypt con salt.",
        "No almacenamos contenido original de plataformas de terceros (videos, fotos, archivos). Solo conservamos metadatos y resúmenes generados por IA.",
        "Realizamos copias de seguridad periódicas de los datos.",
        "El acceso a datos sensibles está restringido al personal autorizado.",
        "En caso de violación de seguridad, notificaremos a los usuarios afectados en un plazo máximo de 72 horas.",
      ],
    },
    {
      title: "4. Tus Derechos",
      content: [
        "Acceso: puedes solicitar una copia de todos tus datos personales.",
        "Rectificación: puedes corregir tus datos en cualquier momento desde la configuración del perfil.",
        "Eliminación: puedes solicitar la eliminación de tu cuenta y todos tus datos asociados.",
        "Portabilidad: puedes exportar tus datos en formato estructurado.",
        "Oposición: puedes oponerte al tratamiento de tus datos para fines de marketing.",
        "Retirada de consentimiento: puedes retirar tu consentimiento en cualquier momento.",
        "Para ejercer estos derechos, contáctanos en support@msmmystore.com.",
      ],
    },
    {
      title: "5. Cookies",
      content: [
        "Usamos cookies esenciales para el funcionamiento de la Plataforma (sesión, autenticación, preferencias).",
        "No usamos cookies de rastreo de terceros para publicidad comportamental.",
        "Puedes gestionar las cookies desde la configuración de tu navegador.",
        "Las cookies de sesión se eliminan al cerrar el navegador.",
      ],
    },
    {
      title: "6. Servicios de Terceros",
      content: [
        "Stripe: procesamiento de pagos para membresías Pro y Cuba Plus. Tus datos de pago se envían directamente a Stripe; nosotros recibimos solo un token de confirmación.",
        "Supabase: infraestructura de base de datos y autenticación. Los datos se almacenan en servidores de Supabase con estándares de seguridad empresariales.",
        "Google Gemini: motor de IA para ELIANA. Los análisis se envían a la API de Gemini de forma anonimizada. No compartimos datos personales identificables.",
        "APIs de plataformas externas: al conectar una red social, ZAFIRO accede solo a metadatos públicos o autorizados por el usuario. No almacenamos credenciales de acceso.",
      ],
    },
    {
      title: "7. Retención de Datos",
      content: [
        "Los datos se conservan mientras la cuenta esté activa.",
        "Al eliminar la cuenta, los datos personales se eliminan en un plazo máximo de 30 días.",
        "El contenido público (preguntas, respuestas) puede conservarse anonimizado para mantener la integridad del Mapa Vivo del Conocimiento.",
        "Los registros de pago se conservan conforme a obligaciones fiscales (mínimo 5 años en España).",
      ],
    },
    {
      title: "8. Privacidad de Plataformas Conectadas",
      content: [
        "ZAFIRO no almacena el contenido original de las plataformas conectadas (YouTube, Instagram, TikTok, etc.).",
        "Solo guardamos: URL pública, título, descripción, metadatos y resúmenes generados por ELIANA.",
        "Las vistas previas se generan usando APIs oficiales o metadatos Open Graph. Cada creador autoriza su contenido al conectarlo.",
        "Cada plataforma origen (YouTube, Instagram, etc.) conserva sus propias políticas de derechos de autor y gestiona cualquier infracción.",
        "El usuario controla la visibilidad de cada plataforma conectada mediante el toggle público/privado.",
        "No almacenamos credenciales de acceso a plataformas de terceros.",
      ],
    },
    {
      title: "9. Delegado de Protección de Datos",
      content: "Puedes contactar a nuestro Delegado de Protección de Datos en: support@msmmystore.com. Respondemos a todas las solicitudes en un plazo máximo de 30 días.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Política de Privacidad</h1>
            <p className="text-sm text-slate-400">Última actualización: Julio 2026</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-bold text-white">Nuestro Compromiso</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            En ZAFIRO, la privacidad no es una característica: es un principio fundamental. 
            Diseñamos cada funcionalidad pensando primero en la protección de tus datos. 
            No almacenamos contenido original de terceros, no compartimos información sin consentimiento 
            y te damos control total sobre tu información.
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={i} className="p-5 rounded-2xl glass">
              <h2 className="text-sm font-bold text-white mb-3">{s.title}</h2>
              {Array.isArray(s.content) ? (
                <ul className="space-y-2">
                  {s.content.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
                      <span className="text-[#00D9FF] mt-1">•</span> {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-400 leading-relaxed">{s.content}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-500">
          <p>Consulta también nuestros <Link href="/terms" className="text-[#00D9FF] hover:underline">Términos y Condiciones</Link></p>
        </div>
      </div>
    </div>
  )
}
