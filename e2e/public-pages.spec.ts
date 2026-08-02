import { test, expect } from "@playwright/test"

const PAGES: Array<{ path: string; name: string }> = [
  { path: "/help", name: "Centro de Ayuda" },
  { path: "/privacy", name: "Política de Privacidad" },
  { path: "/terms", name: "Términos y Condiciones" },
  { path: "/mission", name: "Nuestra Misión" },
  { path: "/values", name: "Nuestros Valores" },
  { path: "/vision", name: "Nuestra Visión" },
  { path: "/what-we-do", name: "Qué Hacemos" },
  { path: "/how-it-works", name: "Cómo Funciona ZAFIRO" },
  { path: "/historias", name: "Historias" },
  { path: "/sponsors-page", name: "Sponsors" },
  { path: "/ecosystem", name: "Ecosistema MSM" },
  { path: "/gemologia", name: "Gemología" },
  { path: "/rules", name: "Reglas de la Comunidad" },
  { path: "/contact", name: "Contacto" },
]

for (const { path, name } of PAGES) {
  test(`public page loads: ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible()
  })
}

test("marketplace page renders a main heading", async ({ page }) => {
  await page.goto("/marketplace")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15000 })
})

test("universo page renders the digital universe section", async ({ page }) => {
  await page.goto("/universo")
  await expect(page.getByRole("heading", { name: "Mi Universo Digital", exact: true })).toBeVisible({ timeout: 15000 })
})

test("voz-viva page renders", async ({ page }) => {
  await page.goto("/voz-viva")
  await expect(page.locator("text=La Voz Viva").first()).toBeVisible({ timeout: 15000 })
})

test("biblioteca is owner-only and redirects unauthenticated users home", async ({ page }) => {
  await page.goto("/biblioteca")
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 })
})
