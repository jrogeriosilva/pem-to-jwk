// Minimal DER reader. Just enough to walk the AlgorithmIdentifier inside an
// SPKI / PKCS#8 / X.509 prefix and extract the algorithm OID (and an inner
// curve OID for ecPublicKey). Not a general ASN.1 parser.

const TAG_SEQUENCE = 0x30
const TAG_OID = 0x06

interface TLV {
  tag: number
  body: Uint8Array
  end: number
}

function readTLV(bytes: Uint8Array, offset: number): TLV {
  if (offset >= bytes.length) throw new Error("ASN.1: unexpected end of data")
  const tag = bytes[offset]
  let lenByte = bytes[offset + 1]
  let lenStart = offset + 2
  let length: number
  if ((lenByte & 0x80) === 0) {
    length = lenByte
  } else {
    const numBytes = lenByte & 0x7f
    if (numBytes === 0 || numBytes > 4) {
      throw new Error("ASN.1: unsupported length encoding")
    }
    length = 0
    for (let i = 0; i < numBytes; i++) {
      length = (length << 8) | bytes[lenStart + i]
    }
    lenStart += numBytes
  }
  const end = lenStart + length
  if (end > bytes.length) throw new Error("ASN.1: length exceeds buffer")
  return { tag, body: bytes.subarray(lenStart, end), end }
}

function oidToString(bytes: Uint8Array): string {
  if (bytes.length === 0) throw new Error("ASN.1: empty OID")
  const first = bytes[0]
  const parts: (number | string)[] = [Math.floor(first / 40), first % 40]
  let value = 0
  for (let i = 1; i < bytes.length; i++) {
    const b = bytes[i]
    value = (value << 7) | (b & 0x7f)
    if ((b & 0x80) === 0) {
      parts.push(value)
      value = 0
    }
  }
  return parts.join(".")
}

/**
 * Read the algorithm OID from the AlgorithmIdentifier of a DER blob.
 *
 * Layout for SPKI / PKCS#8 / X.509:
 *   SEQUENCE                      ← outer
 *     [optional version INTEGER]  (PKCS#8)
 *     SEQUENCE (TBSCert ...)      (X.509: dive once more)
 *     SEQUENCE                    ← AlgorithmIdentifier
 *       OID                       ← algorithm
 *       [optional params]         ← may be a curve OID (ecPublicKey)
 *
 * Returns `{ algOid, paramOid? }` for the algorithm closest to the surface
 * of the structure. For X.509 we descend into the TBSCertificate to find
 * the SubjectPublicKeyInfo's AlgorithmIdentifier.
 */
export function readAlgorithmOid(
  der: Uint8Array,
  kind: "spki" | "pkcs8" | "x509"
): { algOid: string; paramOid?: string } {
  const outer = readTLV(der, 0)
  if (outer.tag !== TAG_SEQUENCE) throw new Error("ASN.1: expected outer SEQUENCE")
  const inner = outer.body

  if (kind === "spki") {
    const algId = readTLV(inner, 0)
    if (algId.tag !== TAG_SEQUENCE) throw new Error("ASN.1: expected AlgorithmIdentifier")
    return readAlgFromAlgId(algId.body)
  }

  if (kind === "pkcs8") {
    // version INTEGER, then AlgorithmIdentifier SEQUENCE.
    const version = readTLV(inner, 0)
    const algId = readTLV(inner, version.end)
    if (algId.tag !== TAG_SEQUENCE) throw new Error("ASN.1: expected AlgorithmIdentifier")
    return readAlgFromAlgId(algId.body)
  }

  // X.509 Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }.
  // Inside tbsCertificate the SubjectPublicKeyInfo is at a known walk: skip
  // version (optional), serialNumber, signature, issuer, validity, subject,
  // then SubjectPublicKeyInfo. We walk by tag types instead of indices to
  // tolerate the optional [0] EXPLICIT version tag.
  const tbs = readTLV(inner, 0)
  if (tbs.tag !== TAG_SEQUENCE) throw new Error("ASN.1: expected TBSCertificate")
  const tbsBody = tbs.body
  let cursor = 0
  let first = readTLV(tbsBody, cursor)
  // Optional version [0] EXPLICIT.
  if (first.tag === 0xa0) {
    cursor = first.end
    first = readTLV(tbsBody, cursor)
  }
  // Skip serialNumber INTEGER, signature SEQUENCE, issuer SEQUENCE,
  // validity SEQUENCE, subject SEQUENCE — five fields before SPKI.
  let next = first
  for (let i = 0; i < 5; i++) {
    cursor = next.end
    next = readTLV(tbsBody, cursor)
  }
  if (next.tag !== TAG_SEQUENCE) throw new Error("ASN.1: expected SubjectPublicKeyInfo")
  const algId = readTLV(next.body, 0)
  if (algId.tag !== TAG_SEQUENCE) throw new Error("ASN.1: expected AlgorithmIdentifier in SPKI")
  return readAlgFromAlgId(algId.body)
}

function readAlgFromAlgId(algIdBody: Uint8Array): { algOid: string; paramOid?: string } {
  const algOidTLV = readTLV(algIdBody, 0)
  if (algOidTLV.tag !== TAG_OID) throw new Error("ASN.1: expected algorithm OID")
  const algOid = oidToString(algOidTLV.body)
  let paramOid: string | undefined
  if (algOidTLV.end < algIdBody.length) {
    const params = readTLV(algIdBody, algOidTLV.end)
    if (params.tag === TAG_OID) {
      paramOid = oidToString(params.body)
    }
  }
  return { algOid, paramOid }
}
