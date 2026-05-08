export type PemType = "spki" | "pkcs8" | "x509"

export interface PemDetectOk {
  ok: true
  type: PemType
  headerLabel: string
  body: Uint8Array
}

export interface PemDetectErr {
  ok: false
  error: string
  suggestion?: string
}

export type PemDetectResult = PemDetectOk | PemDetectErr

const SUPPORTED: Record<string, { type: PemType; label: string }> = {
  "PUBLIC KEY": { type: "spki", label: "PUBLIC KEY (SPKI)" },
  "PRIVATE KEY": { type: "pkcs8", label: "PRIVATE KEY (PKCS#8)" },
  "CERTIFICATE": { type: "x509", label: "CERTIFICATE (X.509)" },
}

const UNSUPPORTED: Record<string, string> = {
  "RSA PRIVATE KEY":
    "PKCS#1 RSA keys aren't supported. Convert to PKCS#8 with: openssl pkcs8 -topk8 -nocrypt -in key.pem -out pkcs8.pem",
  "RSA PUBLIC KEY":
    "PKCS#1 RSA public keys aren't supported. Convert to SPKI with: openssl rsa -in key.pem -RSAPublicKey_in -pubout",
  "EC PRIVATE KEY":
    "SEC1 EC keys aren't supported. Convert to PKCS#8 with: openssl pkcs8 -topk8 -nocrypt -in key.pem -out pkcs8.pem",
  "ENCRYPTED PRIVATE KEY":
    "Encrypted PEM isn't supported. Decrypt first with: openssl pkcs8 -in key.pem -out pkcs8.pem",
  "DSA PRIVATE KEY":
    "DSA keys aren't supported by JWK algorithms.",
  "OPENSSH PRIVATE KEY":
    "OpenSSH keys aren't supported. Convert to PKCS#8 with: ssh-keygen -p -m PKCS8 -f key",
}

const PEM_RE = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]+?)-----END \1-----/i

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/[\s]+/g, "")
  const bin = atob(cleaned)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function detectPem(input: string): PemDetectResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: "Paste a PEM-encoded key or certificate to begin." }
  }

  const match = trimmed.match(PEM_RE)
  if (!match) {
    return {
      ok: false,
      error: "Not a PEM block. Expected -----BEGIN …----- / -----END …----- delimiters.",
      suggestion: "Make sure the entire block (including the BEGIN/END lines) is pasted.",
    }
  }

  const label = match[1].toUpperCase().trim()
  const body = match[2]

  const supported = SUPPORTED[label]
  if (supported) {
    let bytes: Uint8Array
    try {
      bytes = base64ToBytes(body)
    } catch {
      return {
        ok: false,
        error: "PEM body is not valid base64.",
        suggestion: "Check that the base64 content between the BEGIN/END lines isn't truncated.",
      }
    }
    return { ok: true, type: supported.type, headerLabel: supported.label, body: bytes }
  }

  const unsupportedSuggestion = UNSUPPORTED[label]
  if (unsupportedSuggestion) {
    return {
      ok: false,
      error: `${label} is not supported by this converter.`,
      suggestion: unsupportedSuggestion,
    }
  }

  return {
    ok: false,
    error: `Unknown PEM label: ${label}.`,
    suggestion: "Supported labels: PUBLIC KEY, PRIVATE KEY, CERTIFICATE.",
  }
}
