import { exportJWK, importPKCS8, importSPKI, importX509 } from "jose"
import type { JWK } from "jose"
import { readAlgorithmOid } from "@/lib/asn1"
import { detectPem, type PemType } from "@/lib/pem-detect"

export interface ConvertOk {
  ok: true
  jwk: JWK
  alg: string
  type: PemType
  headerLabel: string
}

export interface ConvertErr {
  ok: false
  error: string
  suggestion?: string
}

export type ConvertResult = ConvertOk | ConvertErr

const OID_RSA = "1.2.840.113549.1.1.1"
const OID_EC = "1.2.840.10045.2.1"
const OID_ED25519 = "1.3.101.112"
const OID_X25519 = "1.3.101.110"
const OID_ED448 = "1.3.101.113"
const OID_X448 = "1.3.101.111"

const CURVE_OIDS: Record<string, { curve: string; alg: string }> = {
  "1.2.840.10045.3.1.7": { curve: "P-256", alg: "ES256" },
  "1.3.132.0.34": { curve: "P-384", alg: "ES384" },
  "1.3.132.0.35": { curve: "P-521", alg: "ES512" },
  "1.3.132.0.10": { curve: "secp256k1", alg: "ES256K" },
}

function pickAlg(algOid: string, paramOid: string | undefined): string {
  if (algOid === OID_RSA) return "RS256"
  if (algOid === OID_EC) {
    if (!paramOid) throw new Error("ecPublicKey missing curve parameter OID")
    const curve = CURVE_OIDS[paramOid]
    if (!curve) throw new Error(`Unsupported EC curve: ${paramOid}`)
    return curve.alg
  }
  if (algOid === OID_ED25519) return "EdDSA"
  if (algOid === OID_ED448) return "EdDSA"
  if (algOid === OID_X25519) return "ECDH-ES"
  if (algOid === OID_X448) return "ECDH-ES"
  throw new Error(`Unsupported key algorithm OID: ${algOid}`)
}

export async function convertPemToJwk(pem: string): Promise<ConvertResult> {
  const detected = detectPem(pem)
  if (!detected.ok) return detected

  let alg: string
  try {
    const { algOid, paramOid } = readAlgorithmOid(detected.body, detected.type)
    alg = pickAlg(algOid, paramOid)
  } catch (err) {
    return {
      ok: false,
      error: `Could not infer key algorithm: ${(err as Error).message}`,
      suggestion: "The PEM may be malformed or use a key type this tool doesn't support.",
    }
  }

  try {
    const trimmed = pem.trim()
    let key: CryptoKey | Uint8Array
    if (detected.type === "spki") {
      key = await importSPKI(trimmed, alg, { extractable: true })
    } else if (detected.type === "pkcs8") {
      key = await importPKCS8(trimmed, alg, { extractable: true })
    } else {
      key = await importX509(trimmed, alg, { extractable: true })
    }
    const jwk = await exportJWK(key)
    return {
      ok: true,
      jwk,
      alg,
      type: detected.type,
      headerLabel: detected.headerLabel,
    }
  } catch (err) {
    return {
      ok: false,
      error: `Failed to import key: ${(err as Error).message}`,
      suggestion: "Verify the PEM is well-formed and not corrupted.",
    }
  }
}
