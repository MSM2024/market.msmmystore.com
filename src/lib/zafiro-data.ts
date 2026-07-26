export interface Story {
  id: string;
  name: string;
  avatar: string;
  gradient: string;
  duration: string;
  content: {
    title: string;
    text: string;
    image: string;
    tag: string;
  };
}

export interface QuestionReply {
  author: string;
  avatar: string;
  title: string;
  time: string;
  text: string;
  likes: number;
  isAi?: boolean;
}

export interface Question {
  id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
    verified: boolean;
  };
  time: string;
  title: string;
  details: string;
  category: string;
  views: number;
  repliesCount: number;
  rating: number;
  tagColor: string;
  tagBg: string;
  replies: QuestionReply[];
}

export interface Trend {
  id: string;
  title: string;
  growth: string;
  category: string;
  volume: string;
  sparkline: number[];
  color: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  members: string;
  avatar: string;
  tag: string;
  color: string;
}

export interface Expert {
  rank: number;
  name: string;
  title: string;
  pts: string;
  avatar: string;
  color: string;
  verified: boolean;
}

export interface KnowledgeNode {
  id: string;
  name: string;
  x: number;
  y: number;
  category: string;
  connections: string[];
  description: string;
  breakthrough: string;
}

export interface SponsorCampaign {
  id: string;
  companyName: string;
  campaignName: string;
  tagline: string;
  details: string;
  logo: string;
  image: string;
  targetCategory: string;
  targetAudience: string;
  countries: string[];
  languages: string[];
  budget: number;
  spent: number;
  duration: string;
  ctaText: string;
  impressions: number;
  clicks: number;
  conversions: number;
  status: "Activa" | "Pausada" | "Completada";
}

export const stories: Story[] = [
  {
    id: "s1", name: "Dr. Alex R.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    gradient: "from-cyan-400 to-blue-600", duration: "24h",
    content: { title: "Computación Optica", text: "¡Gran avance! Laboratorios cuánticos logran procesar fotones a temperatura ambiente utilizando guías de onda de silicio modificado.", image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=600", tag: "Física Cuántica" }
  },
  {
    id: "s2", name: "Ana García",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    gradient: "from-purple-500 to-pink-500", duration: "48h",
    content: { title: "Sintéticos Biológicos", text: "Hemos reprogramado células de levadura para sintetizar proteínas complejas que limpian microplásticos oceánicos de forma autónoma.", image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=600", tag: "Biotecnología" }
  },
  {
    id: "s3", name: "Sponsor: Nothing",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120",
    gradient: "from-slate-400 to-black", duration: "Patrocinado",
    content: { title: "Estética Monocromo", text: "Nothing OS integra widgets nativos conectados directamente al flujo asíncrono de ZAFIRO.", image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=600", tag: "Nothing Tech" }
  },
  {
    id: "s4", name: "Ing. Mariana",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    gradient: "from-amber-400 to-rose-500", duration: "24h",
    content: { title: "Diseño Generativo", text: "Hoy entrené un modelo de difusión para conceptualizar hábitats marcianos optimizando la radiación cósmica.", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600", tag: "Diseño & Espacio" }
  }
];

export const questions: Question[] = [
  {
    id: "q1",
    author: { name: "Carlos Medina", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120", title: "Líder de Estrategia Cuántica", verified: true },
    time: "hace 2 horas", title: "¿Cómo afectará la criptografía de red cristalina al ecosistema financiero actual?",
    details: "Con la inminente llegada de computadores cuánticos comerciales de más de 2000 qubits lógicos, los algoritmos tradicionales RSA están en riesgo. ¿Qué medidas de migración a criptografía post-cuántica basada en retículos recomiendan?",
    category: "Ciberseguridad", views: 345, repliesCount: 2, rating: 98,
    tagColor: "text-blue-400 border-blue-500/30", tagBg: "bg-blue-500/10",
    replies: [
      { author: "Dr. Alejandro R.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120", title: "PhD en Criptografía Teórica", time: "hace 1 hora", text: "NIST ya ha estandarizado algoritmos como Kyber y Dilithium. El paso inmediato es realizar una auditoría de 'Agilidad Criptográfica'.", likes: 24 },
      { author: "ELIANA AI", avatar: "", title: "Sintonizadora ZAFIRO", time: "hace 45 minutos", text: "La criptografía basada en vectores de retículos es matemáticamente impenetrable hoy. Sugiero integrar Kyber-1024 en tu pasarela para un escudo del 99.9% contra ataques cuánticos.", likes: 48, isAi: true }
    ]
  },
  {
    id: "q2",
    author: { name: "Dra. Sofía Herrera", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120", title: "Economista Principal", verified: true },
    time: "hace 4 horas", title: "¿Qué métricas determinan el verdadero valor de un activo de datos en 2028?",
    details: "Ante la automatización total, los datos son el único bien de producción insustituible. ¿Cómo calculamos el valor de amortización de un dataset de entrenamiento de nicho?",
    category: "Economía de Datos", views: 198, repliesCount: 1, rating: 94,
    tagColor: "text-purple-400 border-purple-500/30", tagBg: "bg-purple-500/10",
    replies: [
      { author: "Ing. Mariana López", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120", title: "Product Manager de Datos", time: "hace 2 horas", text: "Utilizamos la fórmula de Rendimiento Incremental de Inferencia (IIR): medimos la reducción de tasa de error del modelo tras inyectar el dataset.", likes: 18 }
    ]
  },
  {
    id: "q3",
    author: { name: "Lucas Thorne", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120", title: "Ingeniero Aeroespacial", verified: false },
    time: "hace 12 horas", title: "¿Es viable el helio-3 lunar para reactores de confinamiento magnético?",
    details: "¿El factor de sección eficaz de fusión de la reacción Deuterio-Helio-3 justifica el costo de transporte aeroespacial frente a la fusión clásica Deuterio-Tritio?",
    category: "Ciencia Espacial", views: 412, repliesCount: 1, rating: 97,
    tagColor: "text-amber-400 border-amber-500/30", tagBg: "bg-amber-500/10",
    replies: [
      { author: "ELIANA AI", avatar: "", title: "Sintonizadora ZAFIRO", time: "hace 10 horas", text: "Aunque la temperatura de ignición requerida es ~580M Kelvin, la ventaja crucial es que no libera neutrones destructivos, sino protones que pueden convertirse directamente en electricidad con 90% de eficiencia.", likes: 39, isAi: true }
    ]
  }
];

export const trends: Trend[] = [
  { id: "t1", title: "Metalenguajes de Alineación Genómica", growth: "+142%", category: "Biotecnología", volume: "82K sintonías", sparkline: [20, 35, 30, 45, 60, 55, 85, 95], color: "from-emerald-500 to-cyan-400" },
  { id: "t2", title: "Redes Neuronales de Impulso Químico", growth: "+98%", category: "Inteligencia Artificial", volume: "61K sintonías", sparkline: [40, 45, 35, 55, 50, 75, 70, 88], color: "from-blue-500 to-indigo-600" },
  { id: "t3", title: "Cripto-Gobernanza de Enjambres", growth: "+74%", category: "Web3 & Economía", volume: "43K sintonías", sparkline: [10, 20, 15, 30, 25, 45, 40, 64], color: "from-purple-500 to-pink-500" }
];

export const communities: Community[] = [
  { id: "c1", name: "Sistemas Holográficos 2030", description: "Desarrollo de pantallas ópticas de fase de ondas coherentes sin soporte de cristal.", members: "14.2K expertos", avatar: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&q=80&w=120", tag: "Óptica Teórica", color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5" },
  { id: "c2", name: "Sintetizadores de Proteínas Libres", description: "Comunidad No-Code biológica para programar bacterias modificadas autorreguladas.", members: "9.8K biólogos", avatar: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=120", tag: "Bio-Software", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
  { id: "c3", name: "Macroeconomistas del Margen Cero", description: "Teoría de valor asíncrono para economías pos-escasez automatizadas por agentes.", members: "11.5K economistas", avatar: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=120", tag: "Pos-Escasez", color: "border-purple-500/30 text-purple-400 bg-purple-500/5" }
];

export const experts: Expert[] = [
  { rank: 1, name: "Dr. Alejandro Ramos", title: "Algoritmos Genéticos & Redes Post-Cuánticas", pts: "14,820 PTS", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120", color: "bg-amber-500 text-black", verified: true },
  { rank: 2, name: "Ing. Mariana López", title: "Arquitecta de Redes No-Code & Web3", pts: "12,410 PTS", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120", color: "bg-slate-300 text-black", verified: true },
  { rank: 3, name: "Coach Eduardo Mendoza", title: "Liderazgo en Sistemas Descentralizados", pts: "9,850 PTS", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120", color: "bg-amber-700 text-white", verified: true },
  { rank: 4, name: "Dra. Sofía Herrera", title: "Fórmulas Macroeconómicas y Tokenización", pts: "8,940 PTS", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120", color: "bg-blue-900 text-white", verified: true }
];

export const knowledgeNodes: Record<string, KnowledgeNode> = {
  n1: { id: "n1", name: "Sistemas Autónomos", x: 100, y: 110, category: "IA", connections: ["n2", "n3"], description: "Redes autónomas de agentes de IA autorregulados que gestionan cadenas logísticas enteras sin control humano directo.", breakthrough: "Eficiencia de distribución récord del +432% en ciudades de prueba." },
  n2: { id: "n2", name: "Cálculo Orgánico", x: 280, y: 60, category: "Biotech", connections: ["n1", "n4"], description: "Inoculación de redes de micelio fúngico con pulsos piezoeléctricos para simular compuertas lógicas NAND.", breakthrough: "Cálculos energéticos 10,000 veces más limpios que las GPU tradicionales." },
  n3: { id: "n3", name: "Finanzas Tokenizadas", x: 120, y: 260, category: "Economía", connections: ["n1", "n4"], description: "Colaterales de liquidez automáticos respaldados directamente por la reputación intelectual de los sintonizadores de ZAFIRO.", breakthrough: "Más de $240M de valor intercambiado asíncronamente." },
  n4: { id: "n4", name: "Criptografía Lattice", x: 300, y: 220, category: "Ciberseguridad", connections: ["n2", "n3"], description: "Estructuras algebraicas de n-dimensiones para encapsular firmas de seguridad impenetrables por computadores cuánticos.", breakthrough: "Kyber-1024 adoptado por el 82% de las pasarelas bancarias móviles." }
};

export const defaultSponsors: SponsorCampaign[] = [
  { id: "sp-1", companyName: "Nothing Tech", campaignName: "Lienzo Monocromo Cuántico", tagline: "Nothing OS integra widgets cuánticos nativos.", details: "Sintoniza tu flujo asíncrono de conocimiento sin interferencias en un lienzo monocromo puro.", logo: "N", image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=600", targetCategory: "Ciberseguridad", targetAudience: "Sintonizadores Avanzados", countries: ["Global", "España", "EE.UU."], languages: ["Español", "Inglés"], budget: 800, spent: 320, duration: "30 días", ctaText: "Ver Widgets", impressions: 14520, clicks: 1240, conversions: 412, status: "Activa" },
  { id: "sp-2", companyName: "Vercel Systems", campaignName: "Inferencia en el Borde", tagline: "Despliega modelos de inferencia en el borde global.", details: "Latencia ultra-baja de 0.02ms para tus enjambres de agentes de IA.", logo: "▲", image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=600", targetCategory: "Inteligencia Artificial", targetAudience: "Todos los Sintonizadores", countries: ["Global", "México", "Colombia"], languages: ["Español", "Inglés"], budget: 1500, spent: 750, duration: "Sintonía Continua", ctaText: "Probar Inferencia", impressions: 28940, clicks: 3410, conversions: 980, status: "Activa" },
  { id: "sp-3", companyName: "Stripe Quantum", campaignName: "Monetización Asíncrona", tagline: "Pagos asíncronos instantáneos para economías de datos.", details: "Monetiza tus aportaciones científicas con transferencias inmediatas de valor real.", logo: "💳", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600", targetCategory: "Economía de Datos", targetAudience: "Líderes de Opinión", countries: ["EE.UU.", "España", "México"], languages: ["Español", "Inglés"], budget: 1200, spent: 450, duration: "15 días", ctaText: "Configurar Stripe", impressions: 11200, clicks: 890, conversions: 240, status: "Activa" },
  { id: "sp-4", companyName: "OpenAI Research", campaignName: "Razonamiento Profundo", tagline: "Sistemas avanzados de enjambres inteligentes.", details: "Modelos optimizados de razonamiento lógico continuo para la resolución de anomalías cuánticas.", logo: "🤖", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600", targetCategory: "Inteligencia Artificial", targetAudience: "Sintonizadores Avanzados", countries: ["Global"], languages: ["Inglés"], budget: 2000, spent: 1120, duration: "Sintonía Continua", ctaText: "Explorar Modelos", impressions: 34900, clicks: 4520, conversions: 1540, status: "Activa" },
  { id: "sp-5", companyName: "Linear Labs", campaignName: "Física Gravitacional", tagline: "Física de datos gravitacionales para telemetría espacial.", details: "Seguimiento milimétrico de órbita mediante algoritmos de red de tensión profunda.", logo: "⊘", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600", targetCategory: "Ciencia Espacial", targetAudience: "Líderes de Opinión", countries: ["Global", "EE.UU."], languages: ["Español", "Inglés"], budget: 600, spent: 180, duration: "7 días", ctaText: "Ver Telemetría", impressions: 8900, clicks: 650, conversions: 110, status: "Activa" },
  { id: "sp-6", companyName: "BioSynthetica", campaignName: "Software Celular Activo", tagline: "Programación bacteriana para degradar microplásticos.", details: "Reprogramación autónoma de células de levadura para regenerar ecosistemas acuáticos.", logo: "🧬", image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=600", targetCategory: "Biotecnología", targetAudience: "Todos los Sintonizadores", countries: ["España", "Colombia", "México"], languages: ["Español"], budget: 950, spent: 410, duration: "15 días", ctaText: "Sintonizar Bio", impressions: 12100, clicks: 1040, conversions: 320, status: "Activa" }
];

export const nobleSponsors = [
  { name: "Nothing Tech", support: "Bóvedas Estéticas", tag: "NOTHING OS", color: "from-slate-300 to-slate-400" },
  { name: "Vercel Systems", support: "Inferencia Veloz", tag: "EDGE NETWORK", color: "from-slate-100 to-slate-200" },
  { name: "Linear Labs", support: "Física de Datos", tag: "FLOW TRACKING", color: "from-slate-400 to-slate-500" },
  { name: "OpenAI Research", support: "Enjambres de Agentes", tag: "AGI COMPILING", color: "from-indigo-400 to-indigo-500" }
];

export const chartData = {
  impressions: [2400, 3200, 4100, 3800, 4900, 5400, 6100],
  clicks: [180, 240, 350, 290, 420, 490, 580],
  conversions: [30, 45, 70, 60, 85, 110, 130],
  ctr: [7.5, 7.5, 8.5, 7.6, 8.5, 9.0, 9.5]
};

export const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const SPONSORS_KEY = "zafiro_sponsors"
const QUESTIONS_KEY = "zafiro_questions"

export function loadPersistedSponsors(): SponsorCampaign[] {
  if (typeof window === "undefined") return defaultSponsors
  try {
    const raw = localStorage.getItem(SPONSORS_KEY)
    return raw ? JSON.parse(raw) : defaultSponsors
  } catch {
    return defaultSponsors
  }
}

export function saveSponsors(sponsors: SponsorCampaign[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(SPONSORS_KEY, JSON.stringify(sponsors))
}

export function loadPersistedQuestions(): Question[] {
  if (typeof window === "undefined") return questions
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY)
    return raw ? JSON.parse(raw) : questions
  } catch {
    return questions
  }
}

export function saveQuestions(qs: Question[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(qs))
}

export function getContextualAdMatch(sponsor: SponsorCampaign, selectedTag: string, searchQuery: string, joinedCommunities: string[]) {
  if (selectedTag.toLowerCase() === sponsor.targetCategory.toLowerCase()) {
    return { message: `Sintonía perfecta con tu exploración de "${selectedTag}"`, percentage: 99.4, details: `Este anuncio ha sido reordenado al inicio de tu flujo ya que detectamos una coincidencia de interés del 99.4% con el canal "${selectedTag}".` };
  }
  const categoryKeywords: Record<string, string[]> = {
    "Ciberseguridad": ["kyber", "cripto", "lattice", "seguridad", "antivirus", "ataque", "hacker", "bloqueo", "firma"],
    "Inteligencia Artificial": ["eliana", "ai", "artificial", "neuronal", "agente", "llm", "chat", "modelo", "difusión", "síntesis"],
    "Economía de Datos": ["token", "dinero", "finanzas", "pago", "valor", "comercio", "activo", "bancaria"],
    "Ciencia Espacial": ["lunar", "helio", "gravedad", "cohete", "cosmos", "espacio", "satélite", "astrónomo", "órbita"],
    "Biotecnología": ["célula", "levadura", "proteína", "oceánico", "microplásticos", "biología", "adn", "bacteria"]
  };
  const keywords = categoryKeywords[sponsor.targetCategory] || [];
  const matchesSearch = searchQuery.trim() !== "" && keywords.some(k => searchQuery.toLowerCase().includes(k));
  if (matchesSearch) {
    return { message: `Alineado con tu búsqueda activa de "${searchQuery}"`, percentage: 98.1, details: `ELIANA ha analizado tu búsqueda e identificó que "${sponsor.companyName}" es altamente relevante (98.1% AI Match).` };
  }
  if (joinedCommunities.includes("c1") && sponsor.companyName === "Nothing Tech") {
    return { message: "Sintonizado con tu membresía en: Sistemas Holográficos", percentage: 95.8, details: "Como sintonizador del círculo de Sistemas Holográficos 2030, te beneficias de Nothing OS." };
  }
  return { message: "Coincidencia de Intelecto General", percentage: 88.0, details: "Sintonización premium recomendada. Este patrocinador apoya activamente la infraestructura de conocimiento libre." };
}
