// Cache results so we only probe each algorithm once per page load.
const cache = new Map<string, boolean>()

async function probe(algOid: string, paramOid: string | undefined): Promise<boolean> {
  try {
    if (algOid === "1.3.101.113") {
      // Ed448
      await crypto.subtle.generateKey({ name: "Ed448" }, false, ["sign", "verify"])
    } else if (algOid === "1.3.101.111") {
      // X448
      await crypto.subtle.generateKey({ name: "X448" }, false, ["deriveKey", "deriveBits"])
    } else if (algOid === "1.2.840.10045.2.1" && paramOid === "1.3.132.0.10") {
      // secp256k1 / ES256K
      await crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "secp256k1" },
        false,
        ["sign", "verify"],
      )
    }
    return true
  } catch {
    return false
  }
}

const ALG_DISPLAY: Record<string, string> = {
  "1.3.101.113": "Ed448",
  "1.3.101.111": "X448",
}

/** Returns null for algorithms that are universally supported; otherwise returns
 *  { supported, algName } after probing WebCrypto (result is cached). */
export async function checkWebCryptoSupport(
  algOid: string,
  paramOid?: string,
): Promise<{ supported: boolean; algName: string } | null> {
  let algName = ALG_DISPLAY[algOid]
  if (!algName) {
    if (algOid === "1.2.840.10045.2.1" && paramOid === "1.3.132.0.10") {
      algName = "ES256K (secp256k1)"
    } else {
      return null // universally supported algorithm
    }
  }

  const key = `${algOid}:${paramOid ?? ""}`
  if (!cache.has(key)) {
    cache.set(key, await probe(algOid, paramOid))
  }
  return { supported: cache.get(key)!, algName }
}
