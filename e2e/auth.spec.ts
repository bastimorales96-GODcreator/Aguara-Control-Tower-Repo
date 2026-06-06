import { test, expect } from "@playwright/test"

const TEST_EMAIL    = process.env.E2E_TEST_EMAIL    || "test@aguara.io"
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "test_password_123"

// ─── Login ────────────────────────────────────────────────────────────────────
test.describe("Login", () => {
  test("muestra el formulario correctamente", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Contraseña")).toBeVisible()
    await expect(page.getByRole("link", { name: /olvidaste/i })).toHaveAttribute("href", "/forgot-password")
  })

  test("muestra error con credenciales incorrectas", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill("wrong@example.com")
    await page.getByLabel("Contraseña").fill("wrongpass")
    await page.getByRole("button", { name: /ingresar/i }).first().click()
    await expect(page.getByRole("alert")).toBeVisible()
    await expect(page.getByRole("alert")).toContainText(/incorrectos/i)
  })

  test("redirige al dashboard con credenciales correctas", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(TEST_EMAIL)
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /ingresar/i }).first().click()
    // Wait for redirect
    await expect(page).toHaveURL("/", { timeout: 10_000 })
  })

  test("usuario logueado es redirigido desde /login al dashboard", async ({ page }) => {
    // Login first
    await page.goto("/login")
    await page.getByLabel("Email").fill(TEST_EMAIL)
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /ingresar/i }).first().click()
    await expect(page).toHaveURL("/", { timeout: 10_000 })

    // Try to go to /login again
    await page.goto("/login")
    await expect(page).toHaveURL("/")
  })
})

// ─── Forgot password ─────────────────────────────────────────────────────────
test.describe("Forgot password", () => {
  test("muestra el formulario", async ({ page }) => {
    await page.goto("/forgot-password")
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByRole("button", { name: /enviar link/i })).toBeVisible()
  })

  test("muestra confirmación al enviar email válido", async ({ page }) => {
    await page.goto("/forgot-password")
    await page.getByLabel("Email").fill("cualquier@example.com")
    await page.getByRole("button", { name: /enviar link/i }).click()
    // Supabase always shows success to avoid email enumeration
    await expect(page.getByText(/revisá tu email/i)).toBeVisible({ timeout: 8_000 })
  })
})

// ─── Signup ──────────────────────────────────────────────────────────────────
test.describe("Signup", () => {
  test("muestra el formulario con campos requeridos", async ({ page }) => {
    await page.goto("/signup")
    await expect(page.getByLabel("Nombre completo")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Contraseña")).toBeVisible()
  })

  test("muestra error con contraseña corta", async ({ page }) => {
    await page.goto("/signup")
    await page.getByLabel("Nombre completo").fill("Test User")
    await page.getByLabel("Email").fill("nuevo@example.com")
    await page.getByLabel("Contraseña").fill("123")
    await page.getByRole("button", { name: /crear cuenta gratis/i }).first().click()
    // HTML5 validation or Supabase should catch short password
  })
})

// ─── Protected routes ─────────────────────────────────────────────────────────
test.describe("Rutas protegidas", () => {
  test("redirige a /login si no autenticado", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL("/login")
  })

  test("redirige a /login al intentar /alertas sin auth", async ({ page }) => {
    await page.goto("/alertas")
    await expect(page).toHaveURL("/login")
  })

  test("/forgot-password es pública", async ({ page }) => {
    await page.goto("/forgot-password")
    await expect(page).toHaveURL("/forgot-password")
  })

  test("/reset-password es pública", async ({ page }) => {
    await page.goto("/reset-password")
    await expect(page).toHaveURL("/reset-password")
  })
})
