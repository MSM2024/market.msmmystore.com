import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ZAFIRO — ELIANA Viva · Puerta del ecosistema MSM",
    template: "%s | ZAFIRO",
  },
  description: "La puerta inteligente del ecosistema MSM. Entra con ELIANA, tu guía IA, y abre cada portal del universo ZAFIRO.",
  keywords: ["ZAFIRO", "ELIANA", "MSM", "ecosistema", "IA", "gemología", "Marketplace", "portales", "puerta inteligente"],
  authors: [{ name: "MSM" }],
  openGraph: {
    title: "ZAFIRO — ELIANA Viva · Puerta del ecosistema MSM",
    description: "La puerta inteligente del ecosistema MSM. Entra con ELIANA y abre cada portal del universo ZAFIRO.",
    siteName: "ZAFIRO",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#050816" />
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/icons/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/svg+xml" href="/zafiro-mark.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-title" content="ZAFIRO" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#050816] text-white antialiased flex flex-col min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
