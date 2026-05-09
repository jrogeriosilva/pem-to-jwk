import { describe, expect, it } from "vitest"
import { convertPemToJwk } from "@/lib/pem-to-jwk"
import { SAMPLE_PEMS } from "@/lib/samples"

const expectedAlgById: Record<string, string> = {
  "rsa-2048-spki": "RS256",
  "rsa-2048-pkcs8": "RS256",
  "p256-spki": "ES256",
  "p256-pkcs8": "ES256",
  "rsa-pss-2048-spki": "PS256",
  "rsa-pss-2048-pkcs8": "PS256",
  "x509-cert": "RS256",
}

describe("convertPemToJwk — samples", () => {
  for (const sample of SAMPLE_PEMS) {
    it(`converts ${sample.id} to JWK`, async () => {
      const r = await convertPemToJwk(sample.pem)
      expect(r.ok, r.ok ? "" : `${r.error}: ${r.suggestion ?? ""}`).toBe(true)
      if (!r.ok) return
      expect(r.alg).toBe(expectedAlgById[sample.id])
      expect(r.jwk.kty).toMatch(/^(RSA|EC|OKP)$/)
    })
  }
})

describe("convertPemToJwk — error surfaces", () => {
  it("propagates detect errors verbatim", async () => {
    const r = await convertPemToJwk("not a pem")
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/not a pem block/i)
  })

  it("hints PKCS#1 -> PKCS#8 conversion", async () => {
    const r = await convertPemToJwk(
      "-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----"
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.suggestion).toMatch(/openssl pkcs8/i)
  })

  it("reports DER parse failure with ASN.1 prefix surfaced", async () => {
    // Valid label, valid base64, but body is not a SEQUENCE (random byte 0x00).
    const r = await convertPemToJwk("-----BEGIN PUBLIC KEY-----\nAA==\n-----END PUBLIC KEY-----")
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/der/i)
  })
})
