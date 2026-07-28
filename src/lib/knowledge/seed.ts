import { knowledgeIngestion } from "./ingestion"
import { knowledgeRepo } from "./repository"
import type { KnowledgeTag } from "./types"

export interface SeedDocument {
  title: string
  slug: string
  doc_type: "identity" | "policy" | "faq" | "guide" | "reference" | "operations" | "marketing"
  content: string
  summary: string
  visibility: "public" | "internal"
  priority: number
  tags: string[]
}

export const SEED_DOCUMENTS: SeedDocument[] = [
  {
    title: "ZAFIRO - Knowledge Future",
    slug: "zafiro-identity",
    doc_type: "identity",
    content: `# ZAFIRO - Knowledge Future

## Nuestra Misión
ZAFIRO es la plataforma Knowledge Future que conecta conocimiento, comunidad y comercio. Nuestra misión es democratizar el acceso al conocimiento y crear una economía basada en el valor del saber compartido.

## Nuestra Visión
Ser la plataforma líder en Latinoamérica para la monetización del conocimiento, empoderando a individuos y comunidades para construir prósperos ecosostenibles basados en el saber.

## Valores Fundamentales

### 1. Conocimiento Compartido
Creemos que el conocimiento debe ser accesible y utilizarse para elevar a las comunidades.

### 2. Integridad
Operamos con transparencia y honestidad en todas nuestras interacciones.

### 3. Innovación
Constantemente buscamos nuevas formas de crear valor y resolver problemas.

### 4. Comunidad
Construimos relaciones duraderas basadas en la confianza y el respeto mutuo.

### 5. Excelencia
Nos esforzamos por ofrecer la mejor experiencia posible a nuestros usuarios.

## El Ecosistema MSM
MSM (Mi Sello Mi Mercado) es el corazón del ecosistema ZAFIRO. Conecta:
- **Marketplace**: Comercio de productos y servicios
- **Escuela**: Educación y capacitación
- **Comunidad**: Red social y conexiones
- **Consejo Invisible**: Sabiduría y guía
- **Album de la Vida**: Memoria y legado

## Founder
Miguel Soria Martínez, fundador de MSM MY STORE LLC, creó esta plataforma con la visión de crear un impacto positivo en la comunidad hispanohablante.`,
    summary: "Identidad y valores fundamentales de ZAFIRO, la plataforma Knowledge Future de MSM.",
    visibility: "public",
    priority: 10,
    tags: ["zafiro", "identidad", "valores", "mision", "vision"],
  },
  {
    title: "Marketplace MSM - Guía Completa",
    slug: "marketplace-guide",
    doc_type: "guide",
    content: `# Marketplace MSM - Guía Completa

## ¿Qué es el Marketplace MSM?
El Marketplace MSM es la plataforma de comercio electrónico de ZAFIRO donde puedes comprar y vender productos y servicios de calidad.

## Para Compradores

### ¿Cómo Comprar?
1. Explora las tiendas y productos disponibles
2. Agrega productos al carrito
3. Procede al pago con Stripe
4. Recibe tu pedido en la puerta de tu casa

### Métodos de Pago
- Tarjeta de crédito/débito (Visa, Mastercard, AMEX)
- PayPal
- Transferencia bancaria

### Envíos
- Envío estándar: 5-7 días hábiles
- Envío exprés: 2-3 días hábiles
- Envío internacional: 10-15 días hábiles

## Para Vendedores

### ¿Cómo Crear Tu Tienda?
1. Regístrate en la plataforma
2. Selecciona el plan de vendedor
3. Configura tu tienda con logo y descripción
4. Sube tus productos con fotos y descripciones
5. ¡Empieza a vender!

### Comisiones
- Comisión por venta: 10%
- Sin costos de.setup
- Pagos semanales vía Stripe Connect

### Categorías Populares
- Gemología y piedras preciosas
- Productos naturales y orgánicos
- Arte y artesanías
- Servicios digitales
- Educación y cursos

## Políticas del Marketplace
- Productos auténticos garantizados
- Devoluciones dentro de 30 días
- Soporte al cliente 24/7
- Vendedores verificados`,
    summary: "Guía completa para usar el Marketplace MSM, incluyendo compras, ventas y políticas.",
    visibility: "public",
    priority: 9,
    tags: ["marketplace", "compras", "ventas", "tiendas", "guias"],
  },
  {
    title: "Membresías MSM",
    slug: "memberships",
    doc_type: "reference",
    content: `# Membresías MSM

## Planes Disponibles

### Plan Gratuito
- Acceso básico al marketplace
- Perfil de vendedor limitado
- Soporte por email

### Plan Pro ($29.99/mes)
- Tienda personalizada
- Productos ilimitados
- Analytics avanzados
- Soporte prioritario
- Sin comisiones de transacción

### Plan CUBA+ ($99.99/mes)
- Todo lo del Plan Pro
- Marketplace dedicado
- API access
- Manager de cuenta dedicado
- Marketing incluido
-多idioma soporte

## Beneficios por Nivel

### Nivel 1: Miembro
- Acceso a comunidad
- Descuentos básicos
- Recompensas estándar

### Nivel 2: VIP
- Acceso anticipado a nuevos productos
- Descuentos exclusivos
- Eventos especiales

### Nivel 3: Embajador
- Comisiones por referidos
- Productos gratis mensuales
- Acceso a contenido premium

## Cómo Suscribirse
1. Inicia sesión en tu cuenta
2. Ve a Configuración > Membresías
3. Selecciona el plan que deseas
4. Completa el pago con Stripe
5. ¡Disfruta de tus beneficios!

## Cancelación
- Puedes cancelar en cualquier momento
- Sin penalizaciones
- Acceso hasta el final del período facturado`,
    summary: "Detalles de los planes de membresía MSM, beneficios y cómo suscribirse.",
    visibility: "public",
    priority: 8,
    tags: ["membresias", "planes", "pro", "cuba-plus", "suscripciones"],
  },
  {
    title: "Programa de Referidos MSM",
    slug: "referrals-program",
    doc_type: "marketing",
    content: `# Programa de Referidos MSM

## ¿Cómo Funciona?
Invita a tus amigos a unirse a MSM y gana recompensas por cada referido que se registre y realice su primera compra.

## Estructura de Recompensas

### Por Referido Directo
- $10 en créditos por cada referido que se registre
- $25 adicionales cuando realice su primera compra
- 5% de comisión en sus compras durante el primer año

### Niveles de Referido
- **Nivel 1**: Tus referidos directos
- **Nivel 2**: Referidos de tus referidos (2%)
- **Nivel 3**: Referidos del tercer nivel (1%)

## Cómo Compartir Tu Link
1. Inicia sesión en tu cuenta
2. Ve a Referidos en tu dashboard
3. Copia tu link único
4. Comparte por WhatsApp, email, redes sociales
5. ¡Gana recompensas!

## Bonos Especiales
- **Referido Estrella**: 5 referidos en un mes = $100 bonus
- **Embajador MSM**: 20 referidos = estatus VIP gratis por 1 año
- **Líder Comunitario**: 50 referidos = comisión del 10% en tu red

## Reglas Importantes
- Los referidos deben ser personas nuevas (no cuentas existentes)
- Las recompensas secredited automáticamente
- Puedes retirar tus créditos cuando quieras
- No se permite spam o publicidad engañosa

## Panel de Referidos
Accede a tu panel para ver:
- Total de referidos
- Comisiones generadas
- Niveles de tu red
- Pagos recibidos`,
    summary: "Guía completa del programa de referidos MSM, recompensas y niveles.",
    visibility: "public",
    priority: 7,
    tags: ["referidos", "recompensas", "comisiones", "embajador"],
  },
  {
    title: "Sistema de Pagos MSM",
    slug: "payments-system",
    doc_type: "operations",
    content: `# Sistema de Pagos MSM

## Plataforma de Pagos
MSM utiliza Stripe como procesador de pagos principal, garantizando transacciones seguras y confiables.

## Para Compradores

### Métodos Aceptados
- Tarjeta de crédito (Visa, Mastercard, American Express)
- Tarjeta de débito
- PayPal
- Apple Pay
- Google Pay

### Seguridad
- Cifrado SSL de 256 bits
- Cumplimiento PCI DSS Nivel 1
- Verificación 3D Secure
- Protección contra fraude

### Proceso de Pago
1. Selecciona tus productos
2. Ingresa datos de envío
3. Elige método de pago
4. Confirma la compra
5. Recibe confirmación por email

## Para Vendedores

### Stripe Connect
- Cuenta dedicada para cada vendedor
- Pagos semanales automáticos
- Dashboard de transacciones
- Facturas automáticas

### Comisiones
- MSM cobra 10% por transacción
- Sin costos de setup
- Sin cuotas mensuales para vendedores básicos

### Retiros
- Mínimo de retiro: $50
- Frecuencia: Semanal
- Método: Transferencia bancaria
- Tiempo de procesamiento: 1-2 días hábiles

## Facturación
- Facturas automáticas para todas las transacciones
- Descarga desde el dashboard
- Cumplimiento fiscal internacional

## Soporte de Pagos
- Email: pagos@msmmystore.com
- Chat en vivo: 24/7
- WhatsApp: +1 (XXX) XXX-XXXX`,
    summary: "Información completa sobre el sistema de pagos MSM con Stripe.",
    visibility: "public",
    priority: 8,
    tags: ["pagos", "stripe", "compras", "vendedores", "facturacion"],
  },
  {
    title: "Envíos y Logística MSM",
    slug: "shipping-logistics",
    doc_type: "operations",
    content: `# Envíos y Logística MSM

## Cobertura de Envíos

### Nacional (México)
- Envío estándar: 5-7 días hábiles
- Envío exprés: 2-3 días hábiles
- Envío mismo día (Ciudad de México): Disponible

### Internacional
- Estados Unidos: 7-10 días hábiles
- Latinoamérica: 10-15 días hábiles
- Europa: 15-20 días hábiles
- Asia: 20-25 días hábiles

## Costos de Envío

### Estándar
- México: $99 MXN
- Estados Unidos: $15 USD
- Latinoamérica: $25 USD
- Europa: $35 USD

### Exprés
- México: $199 MXN
- Estados Unidos: $30 USD
- Latinoamérica: $50 USD

## Rastreo de Pedidos
1. Recibe número de rastreo por email
2. Ingresa a tu cuenta > Pedidos
3. Haz clic en "Rastrear Pedido"
4. Sigue el estado en tiempo real

## Estados del Pedido
- **Procesando**: Pedido confirmado y en preparación
- **Enviado**: Paquete en camino
- **En Tránsito**: Paquete en distribución local
- **Entregado**: Paquete recibido

## Política de Devoluciones
- 30 días para devoluciones
- Producto sin usar y con empaque original
- Reembolso completo o cambio
- Envío de devolución gratuito (México)

## Empresas de Mensajería
- DHL Express
- FedEx
- Estafeta
- RedPack
- UPS (internacional)

## Seguro de Envío
- Cobertura hasta $10,000 MXN
- Protección contra daños y pérdida
- Reclamos en línea`,
    summary: "Información completa sobre envíos, costos, rastreo y devoluciones en MSM.",
    visibility: "public",
    priority: 7,
    tags: ["envios", "logistica", "rastreo", "devoluciones", "dhl", "fedex"],
  },
  {
    title: "Escuela MSM",
    slug: "school-msm",
    doc_type: "guide",
    content: `# Escuela MSM

## ¿Qué es la Escuela MSM?
La Escuela MSM es la plataforma educativa de ZAFIRO donde puedes aprender sobre gemología, negocio, tecnología y desarrollo personal.

## Cursos Disponibles

### Gemología
- **Introducción a las Gemas**: Aprende los fundamentos de las piedras preciosas
- **Identificación de Gemas**: Técnicas para identificar gemas genuinas
- **Valoración de Gemas**: Cómo determinar el valor de una gema
- **Cuidado y Limpieza**: Mantén tus gemas en perfecto estado

### Negocio
- **Emprendimiento Digital**: Cómo iniciar tu negocio en línea
- **Marketing para Vendedores**: Estrategias para vender más
- **Gestión de Inventario**: Control eficiente de tu stock
- **Atención al Cliente**: Servicio excepcional al cliente

### Tecnología
- **Uso de la Plataforma MSM**: Domina todas las funcionalidades
- **Digital Marketing**: Marketing digital efectivo
- **E-commerce Avanzado**: Técnicas avanzadas de venta en línea

### Desarrollo Personal
- **Liderazgo**: Desarrolla tus habilidades de liderazgo
- **Comunicación Efectiva**: Mejora tu comunicación
- **Gestión del Tiempo**: Organiza tu tiempo eficientemente

## Certificación
- Certificados al completar cada curso
- Badges digitales para tu perfil
- Reconocimiento en la comunidad MSM

## Acceso
- Gratis para miembros Pro y superiores
- Cursos premium disponibles para todos
- Acceso ilimitado mientras estés suscrito`,
    summary: "Información sobre la Escuela MSM, cursos disponibles y certificaciones.",
    visibility: "public",
    priority: 6,
    tags: ["escuela", "cursos", "educacion", "gemologia", "certificacion"],
  },
  {
    title: "Consejo Invisible",
    slug: "council-invisible",
    doc_type: "reference",
    content: `# Consejo Invisible

## ¿Qué es el Consejo Invisible?
El Consejo Invisible es una comunidad exclusiva de MSM dedicada a la sabiduría, el crecimiento personal y la guía espiritual. No es una religión, sino un espacio de reflexión y aprendizaje.

## Propósito
- Compartir sabiduría ancestral
- Guiar a los miembros en su crecimiento personal
- Crear una comunidad de apoyo mutuo
- Preservar conocimiento valioso

## Valores del Consejo
1. **Sabiduría**: Buscar y compartir conocimiento verdadero
2. **Integridad**: Actuar con honestidad y honor
3. **Servicio**: Ayudar a otros sin esperar nada a cambio
4. **Humildad**: Reconocer que siempre hay algo por aprender
5. **Comunidad**: Fortalecer los lazos entre miembros

## Actividades
- **Sesiones de Estudio**: Lecturas y discusiones grupales
- **Mentoría**: Acompañamiento personalizado
- **Retiros**: Encuentros presenciales
- **Proyectos Comunitarios**: Iniciativas de impacto social

## Membresía
- Abierto a todos los miembros de MSM
- Sin costo adicional
- Requiere compromiso con los valores
- Participación voluntaria

## Recursos
- Biblioteca digital de enseñanzas
- Grabaciones de sesiones anteriores
- Material de estudio descargable
- Comunidad en línea activa`,
    summary: "Información sobre el Consejo Invisible, su propósito, valores y actividades.",
    visibility: "public",
    priority: 5,
    tags: ["consejo-invisible", "sabiduria", "comunidad", "espiritualidad"],
  },
  {
    title: "Álbum de la Vida",
    slug: "album-life",
    doc_type: "reference",
    content: `# Álbum de la Vida

## ¿Qué es el Álbum de la Vida?
El Álbum de la Vida es una funcionalidad exclusiva de MSM que te permite preservar y compartir los momentos más importantes de tu vida.

## Características

### Creación de Álbumes
- Álbumes ilimitados
- Fotos y videos
- Descripciones y fechas
- Etiquetas y categorías

### Compartir
- Álbumes privados, compartidos o públicos
- Compartir con familia y amigos
- Comentarios y reacciones
- Descarga de álbumes completos

### Preservación
- Almacenamiento en la nube
- Copias de seguridad automáticas
- Calidad original preservada
- Acceso desde cualquier dispositivo

## Usos Populares
- **Familia**: Preservar recuerdos familiares
- **Viajes**: Documentar aventuras
- **Eventos**: Bodas, cumpleaños, graduaciones
- **Legado**: Crear un legado para las generaciones futuras

## Privacidad
- Control total sobre quién ve tu álbum
- Cifrado de datos sensibles
- Eliminación permanente cuando lo desees
- Cumplimiento con LGPD y GDPR

## Almacenamiento
- Plan gratuito: 5 GB
- Plan Pro: 50 GB
- Plan CUBA+: Almacenamiento ilimitado`,
    summary: "Información sobre el Álbum de la Vida, funcionalidad de preservación de recuerdos de MSM.",
    visibility: "public",
    priority: 5,
    tags: ["album-vida", "recuerdos", "fotos", "compartir", "privacidad"],
  },
  {
    title: "Seguridad en MSM",
    slug: "security-guide",
    doc_type: "policy",
    content: `# Seguridad en MSM

## Compromiso con la Seguridad
MSM toma la seguridad de sus usuarios muy seriously. Implementamos múltiples capas de protección para garantizar la seguridad de tus datos y transacciones.

## Autenticación

### Contraseña Segura
- Mínimo 8 caracteres
- Al menos una mayúscula, una minúscula y un número
- Caracteres especiales recomendados
- Cambio periódico sugerido

### Autenticación de Dos Factores (2FA)
- Disponible para todas las cuentas
- Códigos por SMS o authenticator app
- Recuperación de cuenta segura

## Protección de Datos

### Cifrado
- Datos en tránsito: TLS 1.3
- Datos en reposo: AES-256
- Contraseñas: bcrypt con salt

### Almacenamiento
- Servidores en la nube (AWS/GCP)
- Copias de seguridad diarias
- Redundancia geográfica
- Cumplimiento SOC 2

## Prevención de Fraude

### Detección Automática
- Monitoreo de transacciones sospechosas
- Verificación de identidad para vendedores
- Análisis de comportamiento de compra
- Alertas en tiempo real

### Acciones
- Bloqueo inmediato de cuentas comprometidas
- Revisión manual de transacciones sospechosas
- Colaboración con autoridades cuando es necesario

## Reporte de Incidentes
- Email: seguridad@msmmystore.com
- Formulario web: msmmystore.com/security
- Línea directa: +1 (XXX) XXX-XXXX
- Respuesta en menos de 24 horas

## Mejores Prácticas para Usuarios
1. Usa contraseñas únicas y seguras
2. Activa la autenticación de dos factores
3. No compartas tus credenciales
4. Verifica la URL antes de ingresar datos
5. Reporta actividad sospechosa inmediatamente`,
    summary: "Política de seguridad de MSM, autenticación, protección de datos y prevención de fraude.",
    visibility: "internal",
    priority: 9,
    tags: ["seguridad", "autenticacion", "proteccion", "fraude", "contrasenas"],
  },
  {
    title: "ELIANA - Asistente IA de MSM",
    slug: "eliana-assistant",
    doc_type: "identity",
    content: `# ELIANA - Asistente IA de MSM

## ¿Quién es ELIANA?
ELIANA es la asistente de inteligencia artificial de MSM. Su nombre significa "luz" y su misión es iluminar el camino de los usuarios en el ecosistema MSM.

## Personalidad
- Amable y empática
- Conocedora del ecosistema MSM
- Proactiva en ofrecer ayuda
- Respetuosa y profesional
- Entusiasta pero no exagerada

## Capacidades

### Conocimiento
- Información sobre MSM y sus funcionalidades
- Detalles del marketplace y productos
- Ayuda con membresías y pagos
- Información sobre envíos y logística
- Soporte técnico básico

### Acciones
- Guiar a usuarios en la plataforma
- Responder preguntas frecuentes
- Conectar con soporte humano cuando es necesario
- Proporcionar recomendaciones personalizadas

## Canales de Comunicación
- **Web Chat**: Disponible en el sitio principal
- **WhatsApp**: Próximamente
- **Telegram**: Próximamente
- **Marketplace**: Asistencia contextual en compras

## Disponibilidad
- 24/7 para consultas básicas
- Horario laboral para soporte humano
- Respuesta inmediata para la mayoría de consultas

## Limitaciones
- No puede procesar pagos directamente
- No puede modificar pedidos en curso
- No tiene acceso a información financiera sensible
- Puede conectar con soporte humano para casos complejos

## Cómo Hablar con ELIANA
1. Haz clic en el ícono de ELIANA en cualquier página
2. Escribe tu pregunta o solicitud
3. Recibe una respuesta útil y relevante
4. Si necesitas más ayuda, solicita soporte humano`,
    summary: "Información sobre ELIANA, la asistente de IA de MSM, sus capacidades y cómo usarla.",
    visibility: "public",
    priority: 8,
    tags: ["eliana", "asistente", "ia", "chat", "soporte"],
  },
]

export async function seedKnowledgeBase(): Promise<{
  success: boolean
  documents_created: number
  errors: string[]
}> {
  let documentsCreated = 0
  const errors: string[] = []

  for (const doc of SEED_DOCUMENTS) {
    try {
      const result = await knowledgeIngestion.ingestDocument({
        title: doc.title,
        slug: doc.slug,
        doc_type: doc.doc_type,
        content: doc.content,
        summary: doc.summary,
        visibility: doc.visibility,
        priority: doc.priority,
        status: "published",
        language: "es",
        metadata: { tags: doc.tags },
      })

      if (result) {
        documentsCreated++
        for (const tagName of doc.tags) {
          const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          const { knowledgeRepo } = await import("./repository")
          const existingTags = await knowledgeRepo.listTags()
          let tag = existingTags.find((t: KnowledgeTag) => t.slug === slug) || null

          if (!tag) {
            tag = await knowledgeRepo.createTag({
              name: tagName,
              slug,
              color: "#6B7280",
            })
          }

          if (tag) {
            await knowledgeRepo.addDocumentTag(result.id, tag.id)
          }
        }
      } else {
        errors.push(`Failed to create: ${doc.title}`)
      }
    } catch (error) {
      errors.push(`Error creating ${doc.title}: ${error}`)
    }
  }

  return {
    success: errors.length === 0,
    documents_created: documentsCreated,
    errors,
  }
}

export async function getSeedStats(): Promise<{
  total_seeds: number
  created: number
  errors: number
}> {
  const { knowledgeRepo } = await import("./repository")
  const { documents } = await knowledgeRepo.listDocuments({ limit: 1000 })
  const seedSlugs = SEED_DOCUMENTS.map(d => d.slug)
  const created = documents.filter(d => seedSlugs.includes(d.slug)).length

  return {
    total_seeds: SEED_DOCUMENTS.length,
    created,
    errors: SEED_DOCUMENTS.length - created,
  }
}
