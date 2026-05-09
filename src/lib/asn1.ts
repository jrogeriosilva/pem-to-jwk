// Minimal DER reader. Just enough to walk the AlgorithmIdentifier inside an
// SPKI / PKCS#8 / X.509 prefix and extract the algorithm OID (and an inner
// curve OID for ecPublicKey). Not a general ASN.1 parser.

const TAG_SEQUENCE = 0x30
const TAG_SET = 0x31
const TAG_OID = 0x06
const TAG_INTEGER = 0x02
const TAG_UTCTIME = 0x17
const OID_COMMON_NAME = "2.5.4.3"

interface TLV {
  tag: number
  body: Uint8Array
  end: number
}

function readTLV(bytes: Uint8Array, offset: number): TLV {
  if (offset >= bytes.length) throw new Error("ASN.1: unexpected end of data")
  const tag = bytes[offset]
  const lenByte = bytes[offset + 1]
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

// ── X.509 metadata ──────────────────────────────────────────────────────────

export interface X509Meta {
  serial: string
  issuerCN?: string
  subjectCN?: string
  notBefore: Date
  notAfter: Date
  isExpired: boolean
}

function parseTime(body: Uint8Array, tag: number): Date {
  const str = new TextDecoder().decode(body)
  if (tag === TAG_UTCTIME) {
    // YYMMDDHHMMSSZ — years 00-49 → 2000s, 50-99 → 1900s
    const yr = parseInt(str.slice(0, 2), 10)
    return new Date(
      Date.UTC(
        yr >= 50 ? 1900 + yr : 2000 + yr,
        parseInt(str.slice(2, 4), 10) - 1,
        parseInt(str.slice(4, 6), 10),
        parseInt(str.slice(6, 8), 10),
        parseInt(str.slice(8, 10), 10),
        parseInt(str.slice(10, 12), 10),
      ),
    )
  }
  // GeneralizedTime: YYYYMMDDHHMMSSZ
  return new Date(
    Date.UTC(
      parseInt(str.slice(0, 4), 10),
      parseInt(str.slice(4, 6), 10) - 1,
      parseInt(str.slice(6, 8), 10),
      parseInt(str.slice(8, 10), 10),
      parseInt(str.slice(10, 12), 10),
      parseInt(str.slice(12, 14), 10),
    ),
  )
}

function extractCN(nameBody: Uint8Array): string | undefined {
  let cursor = 0
  while (cursor < nameBody.length) {
    const rdn = readTLV(nameBody, cursor)
    cursor = rdn.end
    if (rdn.tag !== TAG_SET) continue
    let rdnCursor = 0
    while (rdnCursor < rdn.body.length) {
      const atv = readTLV(rdn.body, rdnCursor)
      rdnCursor = atv.end
      if (atv.tag !== TAG_SEQUENCE) continue
      const oidTlv = readTLV(atv.body, 0)
      if (oidTlv.tag !== TAG_OID) continue
      if (oidToString(oidTlv.body) === OID_COMMON_NAME) {
        const valTlv = readTLV(atv.body, oidTlv.end)
        return new TextDecoder().decode(valTlv.body)
      }
    }
  }
  return undefined
}

/** Extract notBefore, notAfter, issuer CN, subject CN and serial from a
 *  DER-encoded X.509 certificate. Never throws — returns empty values on
 *  parse error so the caller can still show partial results. */
export function readX509Metadata(der: Uint8Array): X509Meta {
  try {
    const outer = readTLV(der, 0)
    const tbs = readTLV(outer.body, 0)
    const tbsBody = tbs.body
    let cursor = 0

    // Optional version [0] EXPLICIT
    const maybeVersion = readTLV(tbsBody, cursor)
    if (maybeVersion.tag === 0xa0) cursor = maybeVersion.end

    // serialNumber INTEGER
    const serialTlv = readTLV(tbsBody, cursor)
    if (serialTlv.tag !== TAG_INTEGER) throw new Error("expected serialNumber INTEGER")
    cursor = serialTlv.end
    let serialBytes = serialTlv.body
    // Strip DER sign-padding zero byte for positive integers
    if (serialBytes.length > 1 && serialBytes[0] === 0x00) serialBytes = serialBytes.subarray(1)
    const serial = Array.from(serialBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(":")

    // signature AlgorithmIdentifier (skip)
    cursor = readTLV(tbsBody, cursor).end

    // issuer Name
    const issuerTlv = readTLV(tbsBody, cursor)
    cursor = issuerTlv.end
    const issuerCN = extractCN(issuerTlv.body)

    // validity SEQUENCE { notBefore, notAfter }
    const validityTlv = readTLV(tbsBody, cursor)
    cursor = validityTlv.end
    let vCur = 0
    const notBeforeTlv = readTLV(validityTlv.body, vCur)
    vCur = notBeforeTlv.end
    const notAfterTlv = readTLV(validityTlv.body, vCur)
    const notBefore = parseTime(notBeforeTlv.body, notBeforeTlv.tag)
    const notAfter = parseTime(notAfterTlv.body, notAfterTlv.tag)

    // subject Name
    const subjectTlv = readTLV(tbsBody, cursor)
    const subjectCN = extractCN(subjectTlv.body)

    return { serial, issuerCN, subjectCN, notBefore, notAfter, isExpired: notAfter < new Date() }
  } catch {
    return {
      serial: "",
      notBefore: new Date(0),
      notAfter: new Date(0),
      isExpired: true,
    }
  }
}
