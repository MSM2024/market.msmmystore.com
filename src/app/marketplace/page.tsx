'use client'

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight, BadgeCheck, ChevronRight, CircleDollarSign, Gamepad2, Heart,
  Home, Landmark, MapPin, Package, Search, ShieldCheck, ShoppingCart,
  Smartphone, Sofa, Star, Store, Truck, Headphones, UtensilsCrossed,
  WashingMachine, Send, RefreshCcw, HeartPulse
} from "lucide-react"
import { useRouter } from "next/navigation"
import { usePageTitle } from "@/lib/usePageTitle"
import { fetchCategories, fetchProducts, fetchStores } from "@/lib/marketplace/client"
import type { ProductStatus } from "@/lib/marketplace/types"

interface HomeProduct {
  id: string; name: string; slug: string; final_price: number; base_price: number;
  image: string; store: { name: string }; average_rating: number; review_count: number;
  free_shipping: boolean; status: ProductStatus
}
interface HomeStore { name:string; slug:string; average_rating:number; product_count:number; country:string; logo_url:string }

const sampleProducts: HomeProduct[] = [
  {id:"1",name:"Nevera Mabe 11 pies Top Freezer",slug:"nevera-mabe-11",final_price:320,base_price:320,image:"",store:{name:"ElectroHogar"},average_rating:4.8,review_count:124,free_shipping:true,status:"published"},
  {id:"2",name:"Freidora de aire 5.5L Digital",slug:"freidora-aire",final_price:85,base_price:85,image:"",store:{name:"TecnoTotal"},average_rating:4.6,review_count:98,free_shipping:false,status:"published"},
  {id:"3",name:"Xiaomi Redmi Note 13 128GB",slug:"redmi-note-13",final_price:180,base_price:180,image:"",store:{name:"MundoTech"},average_rating:4.7,review_count:56,free_shipping:true,status:"published"},
  {id:"4",name:"Olla arrocera 1.8L Oster",slug:"olla-oster",final_price:55,base_price:55,image:"",store:{name:"Hogar Perfecto"},average_rating:4.5,review_count:87,free_shipping:false,status:"published"},
  {id:"5",name:"Ventilador de pie 18\" Milex",slug:"ventilador-milex",final_price:70,base_price:70,image:"",store:{name:"Casa & Más"},average_rating:4.6,review_count:72,free_shipping:false,status:"published"},
  {id:"6",name:"Televisor Samsung 43\" Smart TV",slug:"tv-samsung-43",final_price:340,base_price:340,image:"",store:{name:"TecnoTotal"},average_rating:4.7,review_count:103,free_shipping:true,status:"published"},
]

const sampleStores: HomeStore[] = [
  {name:"ElectroHogar",slug:"electrohogar",average_rating:4.8,product_count:124,country:"CU",logo_url:""},
  {name:"TecnoTotal",slug:"tecnototal",average_rating:4.6,product_count:98,country:"CU",logo_url:""},
  {name:"Hogar Perfecto",slug:"hogar-perfecto",average_rating:4.7,product_count:176,country:"CU",logo_url:""},
  {name:"MundoTech",slug:"mundotech",average_rating:4.6,product_count:93,country:"CU",logo_url:""},
  {name:"Vida Sana",slug:"vida-sana",average_rating:4.5,product_count:68,country:"CU",logo_url:""},
  {name:"DeportePlus",slug:"deporteplus",average_rating:4.6,product_count:57,country:"CU",logo_url:""},
]

const categories = [
  {label:"Electrodomésticos",icon:WashingMachine,href:"/marketplace/productos?category=electrodomesticos"},
  {label:"Alimentos",icon:UtensilsCrossed,href:"/marketplace/productos?category=alimentos"},
  {label:"Remesas",icon:Send,href:"/remesas"},
  {label:"Cambio de divisas",icon:RefreshCcw,href:"/cambio"},
  {label:"Cajeros",icon:Landmark,href:"/cajeros"},
  {label:"Tiendas VIP",icon:Store,href:"/marketplace/tiendas"},
  {label:"Salud y belleza",icon:HeartPulse,href:"/marketplace/productos?category=salud-belleza"},
  {label:"Tecnología",icon:Gamepad2,href:"/marketplace/productos?category=tecnologia"},
  {label:"Hogar",icon:Sofa,href:"/marketplace/productos?category=hogar"},
  {label:"Deportes",icon:CircleDollarSign,href:"/marketplace/productos?category=deportes"},
]

const quick = [
  ["Electrodomésticos",WashingMachine,"/marketplace/productos?category=electrodomesticos"],
  ["Alimentos",UtensilsCrossed,"/marketplace/productos?category=alimentos"],
  ["Remesas",Send,"/remesas"],["Cambio",RefreshCcw,"/cambio"],["Cajeros",MapPin,"/cajeros"],["Tiendas VIP",Star,"/marketplace/tiendas"]
] as const

function ProductVisual({index}:{index:number}) {
  const icons = [WashingMachine, UtensilsCrossed, Smartphone, Home, RefreshCcw, Gamepad2]
  const Icon = icons[index % icons.length]
  return <div className="msm-product-fallback"><Icon size={54}/></div>
}

export default function MarketplacePage() {
  usePageTitle("MSM Marketplace")
  const router = useRouter()
  const [heroQuery,setHeroQuery] = useState("")
  const [products,setProducts] = useState<HomeProduct[]>(sampleProducts)
  const [stores,setStores] = useState<HomeStore[]>(sampleStores)

  useEffect(()=>{
    Promise.all([fetchProducts({limit:6,sort:"popular"}),fetchStores({limit:6}),fetchCategories()])
      .then(([p,s])=>{
        if(p.products.length) setProducts(p.products.slice(0,6).map(x=>({
          id:x.id,name:x.name,slug:x.slug,final_price:x.final_price,base_price:x.base_price,
          image:x.images?.[0]?.url||"",store:{name:x.store?.name||"MSM Store"},
          average_rating:x.average_rating,review_count:x.review_count,free_shipping:x.free_shipping,status:x.status
        })))
        if(s.stores.length) setStores(s.stores.slice(0,6).map(x=>({
          name:x.name,slug:x.slug,average_rating:x.average_rating,product_count:x.product_count,country:x.country,logo_url:x.logo_url
        })))
      }).catch(()=>{})
  },[])

  const submitHero=(e:FormEvent)=>{
    e.preventDefault()
    if(heroQuery.trim()) router.push(`/marketplace/productos?q=${encodeURIComponent(heroQuery.trim())}`)
  }

  return (
    <>
      <section className="msm-hero">
        <div className="msm-hero-photo"/>
        <div className="msm-hero-overlay"/>
        <div className="msm-container msm-hero-grid">
          <div className="msm-hero-copy">
            <div className="msm-eyebrow">COMPRAS LOCALES <i/> SERVICIOS CONFIABLES <i/> UNA CUBA MÁS CONECTADA</div>
            <h1>Descubre más en<br/><span>MSM Marketplace</span></h1>
            <p>Productos, servicios, remesas y tiendas verificadas<br className="desktop-only"/> para una Cuba más conectada.</p>
            <form className="msm-hero-search" onSubmit={submitHero}>
              <Search size={21}/>
              <input value={heroQuery} onChange={e=>setHeroQuery(e.target.value)} placeholder="Explora productos, tiendas o servicios..." />
              <button>Buscar</button>
            </form>
            <div className="msm-quick-links">
              {quick.map(([label,Icon,href])=><Link key={label} href={href}><Icon size={16}/>{label}</Link>)}
            </div>
          </div>

          <div className="msm-city-script">Santiago<br/><span>de Cuba</span><small>NUESTRA GENTE<br/>NUESTRAS TIENDAS<br/>MÁS POSIBILIDADES</small></div>

          <div className="msm-location-card">
            <div className="msm-location-top">
              <MapPin size={33}/>
              <div><small>Tienda oficial en tu zona</small><strong>Segundo Frente,<br/>Santiago de Cuba</strong></div>
              <ChevronRight/>
            </div>
            <div className="msm-location-features">
              <span><Truck/><b>Entrega local</b></span>
              <span><BadgeCheck/><b>Tiendas verificadas</b></span>
              <span><Headphones/><b>Soporte real</b></span>
            </div>
          </div>
        </div>
      </section>

      <main className="msm-content">
        <div className="msm-container">
          <section className="msm-trustbar">
            <div><ShieldCheck/><span><b>Pagos seguros</b><small>Tu dinero protegido</small></span></div>
            <div><Truck/><span><b>Entregas locales</b><small>Rápido y confiable</small></span></div>
            <div><BadgeCheck/><span><b>Vendedores verificados</b><small>Tiendas con buena reputación</small></span></div>
            <div><Headphones/><span><b>Soporte real</b><small>Estamos para ayudarte</small></span></div>
          </section>

          <section className="msm-section">
            <div className="msm-section-title"><h2>Categorías populares</h2><Link href="/marketplace/productos">Ver todas las categorías <ArrowRight size={16}/></Link></div>
            <div className="msm-category-row">
              {categories.map(({label,Icon,href})=><Link className="msm-category-card" key={label} href={href}><Icon/><span>{label}</span></Link>)}
              <button className="msm-round-next"><ChevronRight/></button>
            </div>
          </section>

          <section className="msm-section">
            <div className="msm-section-title"><h2>Productos destacados</h2><Link href="/marketplace/productos">Ver más productos <ArrowRight size={16}/></Link></div>
            <div className="msm-products-grid">
              {products.slice(0,6).map((p,i)=>(
                <Link className="msm-product-card" key={p.id} href={`/marketplace/productos/${p.slug}`}>
                  <div className="msm-product-image">
                    {p.image ? <Image src={p.image} alt={p.name} fill sizes="180px" className="object-contain"/> : <ProductVisual index={i}/>}
                  </div>
                  <div className="msm-product-info">
                    <h3>{p.name}</h3>
                    <div className="msm-price">${Math.round(p.final_price)} <span>USD</span></div>
                    <div className="msm-storeline">{p.store.name}<BadgeCheck size={13}/></div>
                    <div className="msm-rating"><Star size={13} fill="currentColor"/><b>{p.average_rating || "4.8"}</b> <span>({p.review_count || 0})</span></div>
                  </div>
                  <span className="msm-addcart"><ShoppingCart size={16}/></span>
                </Link>
              ))}
            </div>
          </section>

          <section className="msm-section msm-stores-section">
            <div className="msm-section-title"><h2>Tiendas destacadas</h2><Link href="/marketplace/tiendas">Ver todas las tiendas <ArrowRight size={16}/></Link></div>
            <div className="msm-stores-grid">
              {stores.slice(0,6).map((s,i)=>(
                <Link href={`/marketplace/tiendas/${s.slug}`} className="msm-store-card" key={s.slug}>
                  <div className="msm-store-logo">{s.logo_url ? <Image src={s.logo_url} alt={s.name} fill sizes="52px" className="object-cover"/> : ["EH","TT","HP","MT","VS","DP"][i] || "MS"}</div>
                  <div><h3>{s.name} <BadgeCheck size={13}/></h3><p>{["Hogar y electrodomésticos","Tecnología para todos","Hogar y cocina","Celulares y electrónica","Salud y belleza","Deportes y fitness"][i]||"Marketplace"}</p><span className="msm-rating"><Star size={13} fill="currentColor"/><b>{s.average_rating || "4.8"}</b> ({s.product_count || 0})</span></div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="msm-footer">
        <div className="msm-container msm-footer-inner">
          <div className="msm-footer-brand"><span className="msm-brand-mark">◧</span><div><strong>MSM</strong><small>Marketplace</small></div><p>Cada compra nos acerca a una Cuba más conectada.</p></div>
          <form className="msm-newsletter"><span>✉</span><input placeholder="Tu correo electrónico"/><button>Suscribirme</button></form>
          <div className="msm-social"><span>Síguenos</span><b>f</b><b>◎</b><b>▶</b><b>𝕏</b></div>
        </div>
      </footer>
    </>
  )
}
