# ZAFIRO — Red Social del Conocimiento impulsada por IA (MSM MY STORE LLC)

Aplicación Next.js (App Router) del ecosistema MSM: identidad, membresías, administración, datos y proyectos.
Incluye ELIANA (asistente con Gemini), Knowledge Core (RAG), Biblioteca Viva, Marketplace, historias, el
**Álbum de la Vida (C8)** y la **gestión de Canales de ELIANA (C10)**.

## Documentación

- `ROADMAP_ZAFIRO.md` — diagnóstico, inventario y estado por capítulo.
- `ARCHITECTURE_ZAFIRO.md` — arquitectura, base de datos y seguridad.
- `PENDIENTES_ZAFIRO.md` — decisiones abiertas y bloqueos externos.
- `INFORME_FINAL_ZAFIRO.md` — resumen de cierre (provisional, pendiente C12).
- `docs/status/` — informes de cierre por capítulo (C7, C8, C10, D).

## Verificación

`npx tsc --noEmit` (0 errores) · `eslint` (0 errores en código nuevo) · `vitest run` (75/75) · `npm run build`.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
