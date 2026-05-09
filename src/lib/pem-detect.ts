export type PemType = "spki" | "pkcs8" | "x509" | "pkcs1-private" | "pkcs1-public"

export const MAX_PEM_BYTES = 1_048_576 // 1 MiB

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
  CERTIFICATE: { type: "x509", label: "CERTIFICATE (X.509)" },
  "RSA PRIVATE KEY": { type: "pkcs1-private", label: "RSA PRIVATE KEY (PKCS#1)" },
  "RSA PUBLIC KEY": { type: "pkcs1-public", label: "RSA PUBLIC KEY (PKCS#1)" },
}

const UNSUPPORTED: Record<string, string> = {
  "EC PRIVATE KEY":
    "SEC1 EC keys aren't supported. Convert to PKCS#8 with: openssl pkcs8 -topk8 -nocrypt -in key.pem -out pkcs8.pem",
  "ENCRYPTED PRIVATE KEY":
    "Encrypted PEM isn't supported. Decrypt first with: openssl pkcs8 -in key.pem -out pkcs8.pem",
  "DSA PRIVATE KEY": "DSA keys aren't supported by JWK algorithms.",
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

  if (trimmed.length > MAX_PEM_BYTES) {
    return {
      ok: false,
      error: `PEM input is too large (${(trimmed.length / 1024).toFixed(0)} KiB; limit ${
        MAX_PEM_BYTES / 1024
      } KiB).`,
      suggestion:
        "This converter targets a single PEM block. Trim certificate bundles or chain files to one block before pasting.",
    }
  }

  const match = trimmed.match(PEM_RE)
  if (!match) {
    if (/-----BEGIN /i.test(trimmed)) {
      return {
        ok: false,
        error: "Incomplete PEM block: BEGIN marker found but no matching END marker.",
        suggestion:
          "Make sure the entire block — including the END line and matching label — is pasted.",
      }
    }
    return {
      ok: false,
      error: "Not a PEM block. Expected -----BEGIN …----- / -----END …----- delimiters.",
      suggestion: "Paste the full PEM block, including the BEGIN/END header lines.",
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
        suggestion:
          "Check that the base64 content between the BEGIN/END lines isn't truncated or contains stray characters.",
      }
    }
    if (bytes.length === 0) {
      return {
        ok: false,
        error: "PEM body is empty after decoding.",
        suggestion:
          "The block has BEGIN/END markers but no base64 content between them. Re-export the key.",
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
