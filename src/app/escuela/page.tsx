import Link from "next/link"
import { Gem, Construction } from "lucide-react"

export default function EscuelaPage() {
  return (
    <div className="min-h-screen zafiro-page text-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <Construction className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h1 className="text-xl font-black mb-2">Escuela — En Desarrollo</h1>
        <p className="text-xs text-slate-400 mb-6">Cursos, mentorías y aprendizaje estarán disponibles próximamente.</p>
        <Link href="/" className="inline-flex items-center gap-2 text-[#00D9FF] text-sm hover:underline">
          <Gem className="w-4 h-4" /> Volver a ZAFIRO
        </Link>
      </div>
    </div>
  )
}
