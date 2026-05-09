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

test.describe("PEM → JWK converter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/PEM.*JWK/i)
    await expect(page.getByRole("heading", { name: /PEM.*JWK/i })).toBeVisible()
  })

  test("RSA public key: paste → detect label → show JWK", async ({ page }) => {
    const textarea = page.getByRole("textbox")
    await textarea.fill(RSA_PUBLIC_PEM)

    // Format badge should appear
    await expect(page.getByText(/PUBLIC KEY/i)).toBeVisible()

    // JWK output should contain kty RSA
    await expect(page.getByText(/"kty"/)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/"RSA"/)).toBeVisible()
  })

  test("P-256 private key: paste → detect → JWK with crv P-256", async ({ page }) => {
    await page.getByRole("textbox").fill(P256_PRIVATE_PEM)

    await expect(page.getByText(/"EC"/)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/"P-256"/)).toBeVisible()
  })

  test("X.509 certificate: shows metadata panel", async ({ page }) => {
    await page.getByRole("textbox").fill(X509_CERT)

    // Metadata panel
    await expect(page.getByText(/Certificate metadata/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/PEM to JWK Sample/)).toBeVisible()
    await expect(page.getByText(/Not after/i)).toBeVisible()
  })

  test("copy-to-clipboard button works after conversion", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.getByRole("textbox").fill(RSA_PUBLIC_PEM)

    const copyBtn = page.getByRole("button", { name: /copy/i })
    await expect(copyBtn).toBeVisible({ timeout: 10_000 })
    await copyBtn.click()
    await expect(page.getByRole("button", { name: /copied/i })).toBeVisible()
  })

  test("error shown for invalid input with hint", async ({ page }) => {
    await page.getByRole("textbox").fill("-----BEGIN RSA PRIVATE KEY-----\nnot-valid-base64\n-----END RSA PRIVATE KEY-----")

    await expect(page.getByRole("alert")).toBeVisible()
    await expect(page.getByRole("alert")).toContainText(/PKCS#1/)
  })

  test("clear button resets the form", async ({ page }) => {
    await page.getByRole("textbox").fill(RSA_PUBLIC_PEM)
    await expect(page.getByText(/"kty"/)).toBeVisible({ timeout: 10_000 })

    await page.getByRole("button", { name: /clear/i }).click()
    await expect(page.getByRole("textbox")).toHaveValue("")
    await expect(page.getByText(/"kty"/)).not.toBeVisible()
  })

  test("sample payloads menu loads a PEM", async ({ page }) => {
    const samplesBtn = page.getByRole("button", { name: /samples/i })
    await samplesBtn.click()
    // Pick the first item in the menu
    const firstItem = page.getByRole("menuitem").first()
    await firstItem.click()

    await expect(page.getByRole("textbox")).not.toHaveValue("")
    await expect(page.getByText(/"kty"/)).toBeVisible({ timeout: 10_000 })
  })

  test("drag-and-drop .pem file populates textarea", async ({ page }) => {
    const dropZone = page.locator('[data-testid="pem-dropzone"]')

    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer()
      const file = new File(
        [
          `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA28Iy5bn49miMiSqFTVVr\n6ODEb3AUDKBm5KyItthFkoHRebwT4TSp/jO9vidh+22Wu1EoiyvTgCM+Xsy+1nnF\njIb48LTOrCsb8KWDC25fWdt0Z1q3PfK2D3SjpEZG1EtLJaqZRqB1wboeuTodF+LP\nIy/1WQFsRVuHeLy5nvqh+f9rk5+ilDF2Gyti9Eoon4/Xa2S0fPw1xGmbOB41Tl7a\n68iZk5KwEcS497+l3Ar+y3objp/C3LaA1PCzSNJnrhHCW+Vh1DUUVXjyGuzGN9g7\n21Iuyt39Qnd7fp89pgcEnzaB2yImST2Ie+yPl+fdMjusc9kCC6NIRw3R3moXEg5I\nFQIDAQAB\n-----END PUBLIC KEY-----`,
        ],
        "key.pem",
        { type: "text/plain" },
      )
      dt.items.add(file)
      return dt
    })

    await dropZone.dispatchEvent("dragenter", { dataTransfer })
    await dropZone.dispatchEvent("drop", { dataTransfer })

    await expect(page.getByRole("textbox")).not.toHaveValue("", { timeout: 5_000 })
  })
})

test.describe("Accessibility", () => {
  test("no axe violations on initial load", async ({ page }) => {
    await page.goto("/")
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test("no axe violations after RSA key conversion", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("textbox").fill(RSA_PUBLIC_PEM)
    // Wait for JWK to render
    await expect(page.getByText(/"kty"/)).toBeVisible({ timeout: 10_000 })
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
    expect(results.violations).toEqual([])
  })
})
