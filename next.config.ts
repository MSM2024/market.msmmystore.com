import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [360, 414, 640, 768, 1024, 1280],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/products/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      { source: "/marketplace", destination: "/", permanent: false },
      { source: "/marketplace/:path*", destination: "/products", permanent: false },
      { source: "/soporte", destination: "/support", permanent: false },
      { source: "/signup", destination: "/auth/signup", permanent: false },
      { source: "/registro", destination: "/auth/signup", permanent: false },
      { source: "/crear-cuenta", destination: "/auth/signup", permanent: false },
      { source: "/ayuda", destination: "/help", permanent: false },
      { source: "/preguntas", destination: "/help", permanent: false },
      { source: "/terminos", destination: "/terms", permanent: false },
      { source: "/como-funciona", destination: "/how-it-works", permanent: false },
      { source: "/metodos-activos", destination: "/payment-methods", permanent: false },
      { source: "/verified-sellers", destination: "/tiendas-vip", permanent: false },
      { source: "/perfiles-vip", destination: "/tiendas-vip", permanent: false },
      { source: "/tiendas", destination: "/tiendas-vip", permanent: false },
      { source: "/ordenes", destination: "/orders", permanent: false },
      { source: "/cajeros", destination: "/atm", permanent: false },
      { source: "/billetera", destination: "/wallet", permanent: false },
      { source: "/cambio", destination: "/exchange", permanent: false },
      { source: "/dashboard/economico", destination: "/dashboard/economic", permanent: false }
    ];
  }
};

export default nextConfig;
