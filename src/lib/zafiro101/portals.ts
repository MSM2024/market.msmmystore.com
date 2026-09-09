// ================================================================
// PORTALES ZAFIRO v1.0.1 — Configuración ÚNICA y centralizada.
// ZAFIRO es la PUERTA al universo MSM: cada burbuja abre una
// plataforma. Si una plataforma externa cambia de dominio, se
// actualiza SOLO aquí (ningún otro componente dispersa URLs).
// Los módulos sin plataforma real se muestran honestamente como
// "Próximamente" (estado "futuro") y no ofrecen ABRIR.
// ================================================================

import {
  Gem,
  Globe,
  Layers,
  BookOpen,
  Heart,
  ScrollText,
  GraduationCap,
  Store,
  Crown,
  type LucideIcon,
} from "lucide-react"

export type PortalStatus = "disponible" | "acceso" | "futuro"

export interface PortalDef {
  id: string
  nombre: string
  descripcion: string
  icono: LucideIcon
  url: string
  estado: PortalStatus
  external: boolean
}

export const PORTAL_STATUS_LABEL: Record<PortalStatus, string> = {
  disponible: "Disponible",
  acceso: "Acceso público",
  futuro: "Próximamente",
}

export const PORTALS: PortalDef[] = [
  {
    id: "gemologia",
    nombre: "Gemología",
    descripcion: "Laboratorio, handbook y consultas de gemas.",
    icono: Gem,
    url: "/gemologia",
    estado: "disponible",
    external: false,
  },
  {
    id: "universo",
    nombre: "Universo",
    descripcion: "Mapa vivo de plataformas y vínculos del ecosistema.",
    icono: Globe,
    url: "/universo",
    estado: "disponible",
    external: false,
  },
  {
    id: "ecosistema",
    nombre: "Ecosistema",
    descripcion: "Todos los proyectos MSM en un solo lugar.",
    icono: Layers,
    url: "/ecosystem",
    estado: "disponible",
    external: false,
  },
  {
    id: "biblioteca",
    nombre: "Biblioteca",
    descripcion: "Libros y conocimiento. Plataforma externa enlazada cuando esté publicada.",
    icono: BookOpen,
    url: "/biblioteca",
    estado: "futuro",
    external: false,
  },
  {
    id: "album",
    nombre: "Álbum",
    descripcion: "Historias de vida y legados. Plataforma externa pendiente.",
    icono: Heart,
    url: "/album",
    estado: "futuro",
    external: false,
  },
  {
    id: "historias",
    nombre: "Historias",
    descripcion: "Relatos y memorias. Plataforma externa pendiente.",
    icono: ScrollText,
    url: "/historias",
    estado: "futuro",
    external: false,
  },
  {
    id: "escuela",
    nombre: "Escuela",
    descripcion: "Cursos y mentorías. Plataforma externa pendiente.",
    icono: GraduationCap,
    url: "/escuela",
    estado: "futuro",
    external: false,
  },
  {
    id: "marketplace",
    nombre: "Marketplace",
    descripcion: "La plataforma de comercio de MSM. Se abre en el sitio externo.",
    // URL externa del marketplace MSM. Sobrescribible con
    // NEXT_PUBLIC_MARKETPLACE_URL sin tocar código (p. ej.
    // https://market.msmmystore.com si el comercio vive en ese dominio).
    icono: Store,
    url: process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://msmmystore.com",
    estado: "acceso",
    external: true,
  },
  {
    id: "memberships",
    nombre: "Membresías",
    descripcion: "Planes y beneficios ZAFIRO. Pendiente de activación de pagos.",
    icono: Crown,
    url: "/memberships",
    estado: "futuro",
    external: false,
  },
]

/** Portal listo para abrirse (tiene destino y no es "próximamente"). */
export function isOpenable(portal: PortalDef | null | undefined): portal is PortalDef {
  return !!portal && portal.url.trim().length > 0 && portal.estado !== "futuro"
}