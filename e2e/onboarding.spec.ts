import { test, expect, type Page } from "@playwright/test"

const TEST_EMAIL    = process.env.E2E_TEST_EMAIL    || "test@aguara.io"
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "test_password_123"

// Helper: login
async function loginAs(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(TEST_EMAIL)
  await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
  await page.getByRole("button", { name: /ingresar/i }).first().click()
  await expect(page).toHaveURL("/", { timeout: 10_000 })
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
test.describe("Onboarding", () => {
  test("muestra la página de bienvenida", async ({ page }) => {
    await page.goto("/onboarding")
    // Needs auth
    if (page.url().includes("/login")) {
      await page.getByLabel("Email").fill(TEST_EMAIL)
      await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
      await page.getByRole("button", { name: /ingresar/i }).first().click()
      await page.goto("/onboarding")
    }
    await expect(page.getByText(/bienvenido a aguara/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /empezar/i })).toBeVisible()
  })

  test("navega por los 3 pasos del wizard", async ({ page }) => {
    await page.goto("/onboarding")
    if (page.url().includes("/login")) {
      await page.getByLabel("Email").fill(TEST_EMAIL)
      await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
      await page.getByRole("button", { name: /ingresar/i }).first().click()
      await page.goto("/onboarding")
    }

    // Step 1 → 2
    await page.getByRole("button", { name: /empezar/i }).click()
    await expect(page.getByText(/conectá tu tienda/i)).toBeVisible()

    // Step 2 → skip → 3
    await page.getByRole("button", { name: /saltar/i }).click()
    await expect(page.getByText(/todo listo/i)).toBeVisible()

    // Step 3 → dashboard
    await page.getByRole("button", { name: /ir al dashboard/i }).click()
    await expect(page).toHaveURL("/")
  })
})

// ─── Dashboard ────────────────────────────────────────────────────────────────
test.describe("Dashboard", () => {
  test("carga el dashboard autenticado", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(TEST_EMAIL)
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /ingresar/i }).first().click()
    await expect(page).toHaveURL("/", { timeout: 10_000 })

    // Should show Dashboard heading
    await expect(page.getByText("Dashboard")).toBeVisible()
  })

  test("sidebar tiene links de navegación con iconos y texto", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(TEST_EMAIL)
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /ingresar/i }).first().click()
    await expect(page).toHaveURL("/", { timeout: 10_000 })

    // Check navigation links exist
    await expect(page.getByRole("link", { name: /alertas/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /clientes/i })).toBeVisible()
  })
})
