import { exportJWK, importPKCS8, importSPKI, importX509 } from "jose"
import type { JWK } from "jose"
import { readAlgorithmOid, readX509Metadata, type X509Meta } from "@/lib/asn1"
import { detectPem, type PemType } from "@/lib/pem-detect"
import { checkWebCryptoSupport } from "@/lib/webcrypto-support"

export type { X509Meta }

export interface ConvertOk {
  ok: true
  jwk: JWK
  alg: string
  type: PemType
  headerLabel: string
  x509Meta?: X509Meta
}

export interface ConvertErr {
  ok: false
  error: string
  suggestion?: string
}

export type ConvertResult = ConvertOk | ConvertErr

const OID_RSA = "1.2.840.113549.1.1.1"
const OID_RSA_PSS = "1.2.840.113549.1.1.10"
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

// OIDs we recognize but cannot map to a JOSE alg. The hint explains why
// and points to the conversion path when one exists.
const KNOWN_UNSUPPORTED_OIDS: Record<string, string> = {
  "1.2.840.10040.4.1":
    "DSA (1.2.840.10040.4.1) is not supported by JOSE — there is no JWK algorithm for DSA signatures.",
  "1.2.840.113549.1.1.7":
    "RSA-OAEP (1.2.840.113549.1.1.7) is an encryption-only OID. JWK encodes it as alg 'RSA-OAEP'/'RSA-OAEP-256', which this converter doesn't yet emit.",
  "1.2.840.113549.1.1.5":
    "RSA-SHA1 (1.2.840.113549.1.1.5) is deprecated and not safe to use; convert the key to a current algorithm.",
}

const UNSUPPORTED_OID_MARKER = "__UNSUPPORTED_OID__:"

// AlgorithmIdentifier for rsaEncryption with NULL params.
//   SEQUENCE (13)
//     OID 1.2.840.113549.1.1.1
//     NULL
const RSA_ENCRYPTION_ALGID = new Uint8Array([
  0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
])

function pickAlg(algOid: string, paramOid: string | undefined): string {
  if (algOid === OID_RSA) return "RS256"
  if (algOid === OID_RSA_PSS) return "PS256"
  if (algOid === OID_EC) {
    if (!paramOid) throw new Error("ecPublicKey is missing the curve parameter OID")
    const curve = CURVE_OIDS[paramOid]
    if (!curve) throw new Error(`Unsupported EC curve OID: ${paramOid}`)
    return curve.alg
  }
  if (algOid === OID_ED25519) return "EdDSA"
  if (algOid === OID_ED448) return "EdDSA"
  if (algOid === OID_X25519) return "ECDH-ES"
  if (algOid === OID_X448) return "ECDH-ES"

  const hint = KNOWN_UNSUPPORTED_OIDS[algOid]
  if (hint) throw new Error(`${UNSUPPORTED_OID_MARKER}${hint}`)

  throw new Error(`Unrecognized key algorithm OID: ${algOid}`)
}

// Read a TLV header (tag + length) and return the lengths so the caller can
// slice the body without a fresh sub-array. Mirrors asn1.ts but exposes the
// header length, which we need for splicing.
function readHeader(bytes: Uint8Array, offset: number): { headerLen: number; bodyLen: number } {
  const lenByte = bytes[offset + 1]
  if ((lenByte & 0x80) === 0) return { headerLen: 2, bodyLen: lenByte }
  const numBytes = lenByte & 0x7f
  let len = 0
  for (let i = 0; i < numBytes; i++) len = (len << 8) | bytes[offset + 2 + i]
  return { headerLen: 2 + numBytes, bodyLen: len }
}

function encodeLength(len: number): Uint8Array {
  if (len < 0x80) return new Uint8Array([len])
  if (len < 0x100) return new Uint8Array([0x81, len])
  if (len < 0x10000) return new Uint8Array([0x82, (len >> 8) & 0xff, len & 0xff])
  if (len < 0x1000000) {
    return new Uint8Array([0x83, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff])
  }
  return new Uint8Array([
    0x84,
    (len >>> 24) & 0xff,
    (len >> 16) & 0xff,
    (len >> 8) & 0xff,
    len & 0xff,
  ])
}

function wrapSequence(body: Uint8Array): Uint8Array {
  const lenBytes = encodeLength(body.length)
  const out = new Uint8Array(1 + lenBytes.length + body.length)
  out[0] = 0x30
  out.set(lenBytes, 1)
  out.set(body, 1 + lenBytes.length)
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  // btoa is available in browsers and Node ≥16.
  return btoa(bin)
}

function derToPem(der: Uint8Array, label: string): string {
  const b64 = bytesToBase64(der)
  const lines = b64.match(/.{1,64}/g) ?? [""]
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----\n`
}

// Version INTEGER v1 (value 0) used in PKCS#8 PrivateKeyInfo.
const PKCS8_VERSION = new Uint8Array([0x02, 0x01, 0x00])

// Wrap a PKCS#1 RSAPrivateKey DER blob in a PKCS#8 PrivateKeyInfo container
// so jose can import it with importPKCS8.
//
// PrivateKeyInfo ::= SEQUENCE {
//   version   INTEGER (0),
//   algorithm AlgorithmIdentifier (rsaEncryption + NULL),
//   key       OCTET STRING { RSAPrivateKey }
// }
function wrapPkcs1PrivateInPkcs8(der: Uint8Array): Uint8Array {
  const lenBytes = encodeLength(der.length)
  const octetString = new Uint8Array(1 + lenBytes.length + der.length)
  octetString[0] = 0x04
  octetString.set(lenBytes, 1)
  octetString.set(der, 1 + lenBytes.length)

  const body = new Uint8Array(
    PKCS8_VERSION.length + RSA_ENCRYPTION_ALGID.length + octetString.length,
  )
  body.set(PKCS8_VERSION, 0)
  body.set(RSA_ENCRYPTION_ALGID, PKCS8_VERSION.length)
  body.set(octetString, PKCS8_VERSION.length + RSA_ENCRYPTION_ALGID.length)
  return wrapSequence(body)
}

// Wrap a PKCS#1 RSAPublicKey DER blob in a SubjectPublicKeyInfo container
// so jose can import it with importSPKI.
//
// SubjectPublicKeyInfo ::= SEQUENCE {
//   algorithm AlgorithmIdentifier (rsaEncryption + NULL),
//   key       BIT STRING { 0x00, RSAPublicKey }
// }
function wrapPkcs1PublicInSpki(der: Uint8Array): Uint8Array {
  const bitBody = new Uint8Array(1 + der.length)
  bitBody[0] = 0x00 // no unused bits
  bitBody.set(der, 1)

  const bitLenBytes = encodeLength(bitBody.length)
  const bitString = new Uint8Array(1 + bitLenBytes.length + bitBody.length)
  bitString[0] = 0x03
  bitString.set(bitLenBytes, 1)
  bitString.set(bitBody, 1 + bitLenBytes.length)

  const body = new Uint8Array(RSA_ENCRYPTION_ALGID.length + bitString.length)
  body.set(RSA_ENCRYPTION_ALGID, 0)
  body.set(bitString, RSA_ENCRYPTION_ALGID.length)
  return wrapSequence(body)
}

// RSA-PSS-flavored SPKIs/PKCS#8s carry the RSA-PSS algorithm OID. WebCrypto
// (in Node and several browsers) refuses to import those even when asked for
// PS256. The inner key material (RSAPublicKey / RSAPrivateKey) is identical
// to a regular RSA key, so we splice in the standard rsaEncryption AlgId and
// hand jose a key it knows how to import. The output JWK still uses alg=PS256.
function rewriteSpkiAlgIdToRsa(der: Uint8Array): Uint8Array {
  const outer = readHeader(der, 0)
  const innerStart = outer.headerLen
  const algId = readHeader(der, innerStart)
  const algIdEnd = innerStart + algId.headerLen + algId.bodyLen
  const tail = der.subarray(algIdEnd, innerStart + outer.bodyLen)
  const newInner = new Uint8Array(RSA_ENCRYPTION_ALGID.length + tail.length)
  newInner.set(RSA_ENCRYPTION_ALGID, 0)
  newInner.set(tail, RSA_ENCRYPTION_ALGID.length)
  return wrapSequence(newInner)
}

function rewritePkcs8AlgIdToRsa(der: Uint8Array): Uint8Array {
  const outer = readHeader(der, 0)
  const innerStart = outer.headerLen
  const version = readHeader(der, innerStart)
  const versionEnd = innerStart + version.headerLen + version.bodyLen
  const head = der.subarray(innerStart, versionEnd)
  const algId = readHeader(der, versionEnd)
  const algIdEnd = versionEnd + algId.headerLen + algId.bodyLen
  const tail = der.subarray(algIdEnd, innerStart + outer.bodyLen)
  const newInner = new Uint8Array(head.length + RSA_ENCRYPTION_ALGID.length + tail.length)
  newInner.set(head, 0)
  newInner.set(RSA_ENCRYPTION_ALGID, head.length)
  newInner.set(tail, head.length + RSA_ENCRYPTION_ALGID.length)
  return wrapSequence(newInner)
}

async function convertPkcs1ToJwk(
  der: Uint8Array,
  type: "pkcs1-private" | "pkcs1-public",
  headerLabel: string,
): Promise<ConvertResult> {
  const alg = "RS256"
  try {
    let key: CryptoKey
    if (type === "pkcs1-private") {
      key = await importPKCS8(derToPem(wrapPkcs1PrivateInPkcs8(der), "PRIVATE KEY"), alg, {
        extractable: true,
      })
    } else {
      key = await importSPKI(derToPem(wrapPkcs1PublicInSpki(der), "PUBLIC KEY"), alg, {
        extractable: true,
      })
    }
    const jwk = await exportJWK(key)
    return { ok: true, jwk, alg, type, headerLabel }
  } catch (err) {
    return {
      ok: false,
      error: `Failed to import PKCS#1 RSA key: ${(err as Error).message}`,
      suggestion: "Verify the PEM contains a valid DER-encoded RSA key.",
    }
  }
}

export async function convertPemToJwk(pem: string): Promise<ConvertResult> {
  const detected = detectPem(pem)
  if (!detected.ok) return detected

  if (detected.type === "pkcs1-private" || detected.type === "pkcs1-public") {
    return convertPkcs1ToJwk(detected.body, detected.type, detected.headerLabel)
  }

  let alg: string
  let algOid: string
  let paramOid: string | undefined
  try {
    const oids = readAlgorithmOid(detected.body, detected.type)
    algOid = oids.algOid
    paramOid = oids.paramOid
    alg = pickAlg(oids.algOid, oids.paramOid)
  } catch (err) {
    const msg = (err as Error).message
    if (msg.startsWith(UNSUPPORTED_OID_MARKER)) {
      return {
        ok: false,
        error: "Algorithm not supported.",
        suggestion: msg.slice(UNSUPPORTED_OID_MARKER.length),
      }
    }
    if (msg.startsWith("ASN.1:")) {
      return {
        ok: false,
        error: "PEM body could not be parsed as DER.",
        suggestion: `${msg}. The PEM may be truncated or corrupted; try regenerating it.`,
      }
    }
    return {
      ok: false,
      error: `Could not determine the key algorithm: ${msg}`,
      suggestion:
        "The DER parsed but the algorithm OID is outside the supported set (RSA, RSA-PSS, EC, Ed25519, Ed448, X25519, X448).",
    }
  }

  const support = await checkWebCryptoSupport(algOid, paramOid)
  if (support && !support.supported) {
    return {
      ok: false,
      error: `Your browser does not implement ${support.algName}.`,
      suggestion:
        "Try the latest Chrome or Edge, or process the key in a more complete JS runtime (Node.js ≥ 18).",
    }
  }

  let pemForImport = pem.trim()
  if (algOid === OID_RSA_PSS && detected.type !== "x509") {
    const rewritten =
      detected.type === "spki"
        ? rewriteSpkiAlgIdToRsa(detected.body)
        : rewritePkcs8AlgIdToRsa(detected.body)
    pemForImport = derToPem(rewritten, detected.type === "spki" ? "PUBLIC KEY" : "PRIVATE KEY")
  }

  try {
    let key: CryptoKey | Uint8Array
    if (detected.type === "spki") {
      key = await importSPKI(pemForImport, alg, { extractable: true })
    } else if (detected.type === "pkcs8") {
      key = await importPKCS8(pemForImport, alg, { extractable: true })
    } else {
      key = await importX509(pemForImport, alg, { extractable: true })
    }
    const jwk = await exportJWK(key)
    const x509Meta = detected.type === "x509" ? readX509Metadata(detected.body) : undefined
    return {
      ok: true,
      jwk,
      alg,
      type: detected.type,
      headerLabel: detected.headerLabel,
      x509Meta,
    }
  } catch (err) {
    return {
      ok: false,
      error: `Failed to import key: ${(err as Error).message}`,
      suggestion:
        "Verify the PEM is well-formed. Some browsers don't implement every WebCrypto algorithm (e.g. ES256K, Ed448, X448).",
    }
  }
}
