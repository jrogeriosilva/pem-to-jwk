import { describe, expect, it } from "vitest"
import { detectPem, MAX_PEM_BYTES } from "@/lib/pem-detect"
import { SAMPLE_PEMS } from "@/lib/samples"

describe("detectPem — supported labels", () => {
  for (const sample of SAMPLE_PEMS) {
    it(`detects ${sample.id}`, () => {
      const r = detectPem(sample.pem)
      expect(r.ok).toBe(true)
      if (!r.ok) return
      expect(r.body.length).toBeGreaterThan(0)
      expect(["spki", "pkcs8", "x509", "pkcs1-private", "pkcs1-public"]).toContain(r.type)
    })
  }
})

describe("detectPem — error paths", () => {
  it("rejects empty input", () => {
    const r = detectPem("   \n\t  ")
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/paste a pem/i)
  })

  it("rejects non-PEM text without BEGIN markers", () => {
    const r = detectPem("hello world")
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/not a pem block/i)
  })

  it("disambiguates BEGIN-without-END as incomplete", () => {
    const r = detectPem("-----BEGIN PUBLIC KEY-----\nAAAA")
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/incomplete pem block/i)
  })

  it("detects PKCS#1 RSA PRIVATE KEY as pkcs1-private", () => {
    const r = detectPem(
      "-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----"
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.type).toBe("pkcs1-private")
  })

  it("detects PKCS#1 RSA PUBLIC KEY as pkcs1-public", () => {
    const r = detectPem(
      "-----BEGIN RSA PUBLIC KEY-----\nAAAA\n-----END RSA PUBLIC KEY-----"
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.type).toBe("pkcs1-public")
  })

  it("rejects unsupported label with hint (OpenSSH)", () => {
    const r = detectPem(
      "-----BEGIN OPENSSH PRIVATE KEY-----\nAAAA\n-----END OPENSSH PRIVATE KEY-----"
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.suggestion).toMatch(/ssh-keygen/i)
  })

  it("rejects unsupported label with hint (encrypted)", () => {
    const r = detectPem(
      "-----BEGIN ENCRYPTED PRIVATE KEY-----\nAAAA\n-----END ENCRYPTED PRIVATE KEY-----"
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.suggestion).toMatch(/decrypt/i)
  })

  it("rejects unknown label", () => {
    const r = detectPem("-----BEGIN UNICORN KEY-----\nAAAA\n-----END UNICORN KEY-----")
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/unknown pem label/i)
  })

  it("rejects invalid base64 body", () => {
    const r = detectPem("-----BEGIN PUBLIC KEY-----\n!!!!!\n-----END PUBLIC KEY-----")
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/not valid base64/i)
  })

  it("rejects empty body", () => {
    const r = detectPem("-----BEGIN PUBLIC KEY-----\n\n-----END PUBLIC KEY-----")
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/empty after decoding/i)
  })

  it("rejects oversized input", () => {
    const huge = "x".repeat(MAX_PEM_BYTES + 10)
    const r = detectPem(huge)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/too large/i)
  })
})
