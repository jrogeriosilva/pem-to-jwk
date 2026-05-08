# PEM → JWK

A small browser-only SPA that converts PEM-encoded keys and certificates to [JSON Web Key](https://datatracker.ietf.org/doc/html/rfc7517) format.

Paste an SPKI public key, a PKCS#8 private key, or an X.509 certificate and get the equivalent JWK. Conversion runs entirely in your browser — keys never leave the page.

**Live demo:** [jrogeriosilva.github.io/pem-to-jwk](https://jrogeriosilva.github.io/pem-to-jwk/)

## Features

- **Auto-detects** the PEM type from the header label and the algorithm from the SubjectPublicKeyInfo OID — no dropdowns to fiddle with.
- **Supports** RSA (RS256), EC (ES256 / ES384 / ES512 on P-256 / P-384 / P-521) and Ed25519 (EdDSA).
- **Sample payloads** for every supported format, generated with `openssl`, one click away.
- **Helpful errors:** unsupported PEM labels (PKCS#1, SEC1, encrypted, OpenSSH, DSA) are detected and answered with the exact `openssl` command to convert them.
- **Zero network calls.** All parsing happens locally via [`jose`](https://github.com/panva/jose) and a tiny DER walker.

## Supported inputs

| PEM label | Format | Output JWK fields |
|-----------|--------|-------------------|
| `BEGIN PUBLIC KEY` | SPKI | RSA: `n`, `e` · EC: `crv`, `x`, `y` · OKP: `crv`, `x` |
| `BEGIN PRIVATE KEY` | PKCS#8 | RSA: `n`, `e`, `d`, `p`, `q`, `dp`, `dq`, `qi` · EC: `crv`, `x`, `y`, `d` · OKP: `crv`, `x`, `d` |
| `BEGIN CERTIFICATE` | X.509 (DER inside) | extracts the SPKI, same fields as `PUBLIC KEY` |

**Not supported (detected with conversion hint):** `RSA PRIVATE KEY` / `RSA PUBLIC KEY` (PKCS#1), `EC PRIVATE KEY` (SEC1), `ENCRYPTED PRIVATE KEY`, `OPENSSH PRIVATE KEY`, `DSA PRIVATE KEY`.

## Develop

```bash
npm install
npm run dev
# http://localhost:5173/pem-to-jwk/
```

## Build

```bash
npm run build      # tsc -b && vite build
npm run preview
```

The base path is `/pem-to-jwk/` (in `vite.config.ts`) to match GitHub Pages project-page deployment. Change it if you deploy at a domain root.

## Deploy

`.github/workflows/deploy.yml` builds with Node 22 and publishes `dist/` via GitHub Pages on every push to `main`. To enable it on a fresh fork: **Settings → Pages → Source: GitHub Actions**.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · shadcn (`base-nova` / `neutral`) on `@base-ui/react` · `lucide-react` · `jose` for cryptographic parsing · `react-json-view-lite` for the output tree.

## How it works

```
PEM text
  └─► detect label                       (src/lib/pem-detect.ts)
  └─► base64 → DER bytes
  └─► walk DER, read AlgorithmIdentifier OID
        for X.509: descend TBSCertificate → SPKI first   (src/lib/asn1.ts)
  └─► map OID → JOSE alg (RS256 / ES256 / ES384 / ES512 / EdDSA)
  └─► jose.importSPKI / importPKCS8 / importX509
  └─► jose.exportJWK
  └─► render as a collapsible tree                       (JwkOutput.tsx)
```

The DER reader is ~50 lines of TypeScript — only what's needed to find the algorithm OID. Heavy lifting (key parsing, JWK export) is delegated to `jose`.

## License

MIT.
