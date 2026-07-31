import { test, expect } from "@playwright/test"

test.describe("ZAFIRO — Public Pages", () => {
  test("homepage loads and shows ZAFIRO brand", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=ZAFIRO").first()).toBeVisible()
  })

  test("login page has email and password fields", async ({ page }) => {
    await page.goto("/auth/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("register page has name, email, password fields", async ({ page }) => {
    await page.goto("/auth/register")
    await expect(page.locator('input[placeholder="sintonizador"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("recover password page loads", async ({ page }) => {
    await page.goto("/auth/recover")
    await expect(page.locator("text=Recuperar Contraseña")).toBeVisible()
  })

  test("verify page loads and shows check email message", async ({ page }) => {
    await page.goto("/auth/verify?email=test@example.com")
    await expect(page.locator("text=Revisa tu Correo")).toBeVisible()
  })
})

test.describe("ZAFIRO — Static Pages", () => {
  test("settings page loads and shows settings UI", async ({ page }) => {
    await page.goto("/settings")
    await expect(page.locator("text=Perfil").first()).toBeVisible({ timeout: 10000 })
  })

  test("eliana page loads", async ({ page }) => {
    await page.goto("/eliana")
    await expect(page.locator("text=ELIANA").first()).toBeVisible()
  })

  test("memberships page shows plans", async ({ page }) => {
    await page.goto("/memberships")
    await expect(page.locator("text=Planes de Membresía")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Cuba Plus" })).toBeVisible()
  })

  test("escuela placeholder page shows en desarrollo", async ({ page }) => {
    await page.goto("/escuela")
    await expect(page.locator("text=En Desarrollo")).toBeVisible()
  })

  test("album placeholder page shows en desarrollo", async ({ page }) => {
    await page.goto("/album")
    await expect(page.locator("text=En Desarrollo")).toBeVisible()
  })
})
