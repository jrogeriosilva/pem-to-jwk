import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const RSA_PUBLIC_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA28Iy5bn49miMiSqFTVVr
6ODEb3AUDKBm5KyItthFkoHRebwT4TSp/jO9vidh+22Wu1EoiyvTgCM+Xsy+1nnF
jIb48LTOrCsb8KWDC25fWdt0Z1q3PfK2D3SjpEZG1EtLJaqZRqB1wboeuTodF+LP
Iy/1WQFsRVuHeLy5nvqh+f9rk5+ilDF2Gyti9Eoon4/Xa2S0fPw1xGmbOB41Tl7a
68iZk5KwEcS497+l3Ar+y3objp/C3LaA1PCzSNJnrhHCW+Vh1DUUVXjyGuzGN9g7
21Iuyt39Qnd7fp89pgcEnzaB2yImST2Ie+yPl+fdMjusc9kCC6NIRw3R3moXEg5I
FQIDAQAB
-----END PUBLIC KEY-----`

const P256_PRIVATE_PEM = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgLWz3dEh+tTWYZS2J
vNxJE1VNsWOOmbllhc+oOdv/avGhRANCAATQ4Ny/bZfkW9lisT5M5eBrsGkj0qxt
B2e5ouMDfAZ5ly3QDxFqKHQLeO7Pai4f3hJrYBlmmhHSLRjSVENI1V6v
-----END PRIVATE KEY-----`

const X509_CERT = `-----BEGIN CERTIFICATE-----
MIIDGTCCAgGgAwIBAgIUR3T+gPcoRx2h7cNwRtJgK23CMegwDQYJKoZIhvcNAQEL
BQAwHDEaMBgGA1UEAwwRUEVNIHRvIEpXSyBTYW1wbGUwHhcNMjYwNTA4MjE1MzA5
WhcNMjcwNTA4MjE1MzA5WjAcMRowGAYDVQQDDBFQRU0gdG8gSldLIFNhbXBsZTCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANvCMuW5+PZojIkqhU1Va+jg
xG9wFAygZuSsiLbYRZKB0Xm8E+E0qf4zvb4nYfttlrtRKIsr04AjPl7MvtZ5xYyG
+PC0zqwrG/ClgwtuX1nbdGdatz3ytg90o6RGRtRLSyWqmUagdcG6Hrk6HRfizyMv
9VkBbEVbh3i8uZ76ofn/a5OfopQxdhsrYvRKKJ+P12tktHz8NcRpmzgeNU5e2uvI
mZOSsBHEuPe/pdwK/st6G46fwty2gNTws0jSZ64RwlvlYdQ1FFV48hrsxjfYO9tS
Lsrd/UJ3e36fPaYHBJ82gdsiJkk9iHvsj5fn3TI7rHPZAgujSEcN0d5qFxIOSBUC
AwEAAaNTMFEwHQYDVR0OBBYEFMOS61Peqws1iT19KNXt0SXueZdSMB8GA1UdIwQY
MBaAFMOS61Peqws1iT19KNXt0SXueZdSMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZI
hvcNAQELBQADggEBAF2GFFe8QkIVjYUiXohgMrWaMx46SYm+/9SEVv31xQXLHF1g
fwgaSZV4+zdTSjZk1N4p8NEr8OnCj2YE5YQigO28ZZJoibR8YbcskrpBWAS3Ntxj
7hcXpEFwEcpjO6rIMoeivOWMVWPvxzJS17gHr/Ae+ZNi7fZ9+z2u7WamOGHMZJ08
xyGNyLp9YiBxeS9iPVyj58899zdbQzdtBTSsK4mQuMLM5LyhzfjL3ijqTTo6Q7QB
XCqmg9bMiX+i/gty2mNtu7vXX1viYx3kSupks3TXTurzy8ISekkzqRv8HUkwI4R1
aaPHvFpQRcJJfMtk/r+/2WP7O927QZ4MZfTiyXQ=
-----END CERTIFICATE-----`

// Helper: wait for JWK output to contain a specific key
async function expectJwkKey(page: import("@playwright/test").Page, key: string) {
  // Scope to the JWK output section to avoid matching identical text elsewhere in the page
  const jwkSection = page.locator('[aria-label="JWK output"]')
  await expect(jwkSection).toContainText(`"${key}"`, { timeout: 10_000 })
}

test.describe("PEM → JWK converter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/PEM.*JWK/i)
    await expect(page.getByRole("heading", { name: /PEM.*JWK/i })).toBeVisible()
  })

  test("RSA public key: paste → detect format badge → show JWK kty RSA", async ({ page }) => {
    await page.getByRole("textbox").fill(RSA_PUBLIC_PEM)

    // The FormatBadge renders the exact label text — scope to the toolbar area
    await expect(page.getByText("PUBLIC KEY (SPKI)")).toBeVisible()

    await expectJwkKey(page, "kty")
    await expect(page.locator('[aria-label="JWK output"]')).toContainText('"RSA"')
  })

  test("P-256 private key: paste → JWK kty EC crv P-256", async ({ page }) => {
    await page.getByRole("textbox").fill(P256_PRIVATE_PEM)

    await expectJwkKey(page, "kty")
    await expect(page.locator('[aria-label="JWK output"]')).toContainText('"EC"')
    await expect(page.locator('[aria-label="JWK output"]')).toContainText('"P-256"')
  })

  test("X.509 certificate: shows metadata panel with subject CN", async ({ page }) => {
    await page.getByRole("textbox").fill(X509_CERT)

    // X509MetaPanel — scope to the section to avoid matching the JSON output text
    const metaPanel = page.locator('[aria-label="X.509 certificate metadata"]')
    await expect(metaPanel).toBeVisible({ timeout: 10_000 })
    await expect(metaPanel).toContainText("PEM to JWK Sample")
    await expect(metaPanel).toContainText("Not after")
  })

  test("copy-to-clipboard button works after conversion", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.getByRole("textbox").fill(RSA_PUBLIC_PEM)

    const copyBtn = page.getByRole("button", { name: /copy/i })
    await expect(copyBtn).toBeVisible({ timeout: 10_000 })
    await copyBtn.click()
    await expect(page.getByRole("button", { name: /copied/i })).toBeVisible()
  })

  test("error shown for invalid input with PKCS#1 hint", async ({ page }) => {
    await page.getByRole("textbox").fill(
      "-----BEGIN RSA PRIVATE KEY-----\nnot-valid-base64\n-----END RSA PRIVATE KEY-----",
    )

    // PemInput renders its own alert — use .first() since JwkOutput may show one too
    const alert = page.getByRole("alert").first()
    await expect(alert).toBeVisible()
    await expect(alert).toContainText(/PKCS#1/)
  })

  test("clear button resets the form", async ({ page }) => {
    await page.getByRole("textbox").fill(RSA_PUBLIC_PEM)
    await expectJwkKey(page, "kty")

    await page.getByRole("button", { name: /clear/i }).click()
    await expect(page.getByRole("textbox")).toHaveValue("")
    await expect(page.locator('[aria-label="JWK output"]')).not.toContainText('"kty"')
  })

  test("sample payloads menu loads a PEM and shows JWK", async ({ page }) => {
    const samplesBtn = page.getByRole("button", { name: /samples/i })
    await samplesBtn.click()
    // base-ui Menu.Item renders role="menuitem"
    await page.getByRole("menuitem").first().click()

    await expect(page.getByRole("textbox")).not.toHaveValue("")
    await expectJwkKey(page, "kty")
  })

  test("drag-and-drop .pem file populates textarea", async ({ page }) => {
    const dropZone = page.locator('[data-testid="pem-dropzone"]')

    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer()
      const content = [
        "-----BEGIN PUBLIC KEY-----",
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA28Iy5bn49miMiSqFTVVr",
        "6ODEb3AUDKBm5KyItthFkoHRebwT4TSp/jO9vidh+22Wu1EoiyvTgCM+Xsy+1nnF",
        "jIb48LTOrCsb8KWDC25fWdt0Z1q3PfK2D3SjpEZG1EtLJaqZRqB1wboeuTodF+LP",
        "Iy/1WQFsRVuHeLy5nvqh+f9rk5+ilDF2Gyti9Eoon4/Xa2S0fPw1xGmbOB41Tl7a",
        "68iZk5KwEcS497+l3Ar+y3objp/C3LaA1PCzSNJnrhHCW+Vh1DUUVXjyGuzGN9g7",
        "21Iuyt39Qnd7fp89pgcEnzaB2yImST2Ie+yPl+fdMjusc9kCC6NIRw3R3moXEg5I",
        "FQIDAQAB",
        "-----END PUBLIC KEY-----",
      ].join("\n")
      dt.items.add(new File([content], "key.pem", { type: "text/plain" }))
      return dt
    })

    await dropZone.dispatchEvent("dragenter", { dataTransfer })
    await dropZone.dispatchEvent("drop", { dataTransfer })

    await expect(page.getByRole("textbox")).not.toHaveValue("", { timeout: 5_000 })
  })
})

test.describe("Accessibility", () => {
  // Disable color-contrast rule: the dark/light theme switch happens at runtime
  // and headless Chromium may mis-report contrast for CSS variables.
  const AXE_OPTIONS = {
    rules: { "color-contrast": { enabled: false } },
  }

  test("no axe violations on initial load", async ({ page }) => {
    await page.goto("/")
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .options(AXE_OPTIONS)
      .analyze()
    expect(results.violations).toEqual([])
  })

  test("no axe violations after RSA key conversion", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("textbox").fill(RSA_PUBLIC_PEM)
    await expect(page.locator('[aria-label="JWK output"]')).toContainText('"kty"', {
      timeout: 10_000,
    })
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .options(AXE_OPTIONS)
      .analyze()
    expect(results.violations).toEqual([])
  })
})
