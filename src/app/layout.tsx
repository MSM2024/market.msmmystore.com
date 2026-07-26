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
    default: "ZAFIRO - Knowledge Future",
    template: "%s | ZAFIRO",
  },
  description: "La red social del conocimiento impulsada por Inteligencia Artificial.",
  keywords: ["conocimiento", "IA", "red social", "ciencia", "tecnología", "gemología", "ZAFIRO"],
  authors: [{ name: "MSM" }],
  openGraph: {
    title: "ZAFIRO — Knowledge Future",
    description: "La red social del conocimiento impulsada por Inteligencia Artificial.",
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
        <link rel="icon" type="image/svg+xml" href="/eliana-diamond.svg" />
        <link rel="apple-touch-icon" href="/eliana-diamond.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-[#050816] text-white antialiased flex flex-col min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
