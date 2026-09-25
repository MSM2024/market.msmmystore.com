'use client'

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CircleHelp, CreditCard, MapPin, Package, Search, Send, ShoppingCart,
  UserRound, WalletCards, Landmark, ChevronDown
} from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { useCart } from "@/contexts/CartContext"
import "./marketplace.css"

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  usePageTitle("MSM Marketplace")
  const router = useRouter()
  const { itemCount } = useCart()
  const [query, setQuery] = useState("")

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/marketplace/productos?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="msm-market">
      <div className="msm-utility">
        <div className="msm-container msm-utility-inner">
          <span className="msm-domain">marketplace.msmmystore.com</span>
          <div className="msm-utility-actions">
            <button><MapPin size={14}/> Segundo Frente, Santiago de Cuba <ChevronDown size={13}/></button>
            <span className="msm-separator"/>
            <button>CUP <ChevronDown size={13}/></button>
            <span className="msm-separator"/>
            <Link href="/help"><CircleHelp size={14}/> Ayuda</Link>
          </div>
        </div>
      </div>

      <header className="msm-header">
        <div className="msm-container msm-header-inner">
          <Link href="/marketplace" className="msm-brand" aria-label="MSM Marketplace">
            <span className="msm-brand-mark">◧</span>
            <span><strong>MSM</strong><small>Marketplace</small></span>
          </Link>

          <form className="msm-top-search" onSubmit={submit}>
            <Search size={20}/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Explora productos, tiendas o servicios..." />
            <button type="submit">Buscar</button>
          </form>

          <nav className="msm-main-nav" aria-label="Navegación principal">
            <Link href="/marketplace/productos"><Package/><span>Productos</span></Link>
            <Link href="/remesas"><Send/><span>Remesas</span></Link>
            <Link href="/cajeros"><Landmark/><span>Cajeros</span></Link>
            <Link href="/wallet"><WalletCards/><span>Billetera</span></Link>
            <Link href="/profile"><UserRound/><span>Mi cuenta</span></Link>
            <Link href="/marketplace/pedidos" className="msm-cart"><ShoppingCart/><span>Carrito</span><b>{itemCount > 99 ? "99+" : itemCount}</b></Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
