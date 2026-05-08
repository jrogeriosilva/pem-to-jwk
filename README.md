# PEM → JWK

A small browser-only SPA that converts PEM-encoded keys and certificates to JSON Web Key (JWK) format.

Paste a `PUBLIC KEY` (SPKI), `PRIVATE KEY` (PKCS#8), or `CERTIFICATE` (X.509) in PEM format and get the equivalent JWK. Conversion happens entirely in your browser — nothing is uploaded.

## Stack

Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn (`base-nova` / `neutral`) + `@base-ui/react` + `lucide-react`. Conversion via `jose` (`importSPKI` / `importPKCS8` / `importX509` + `exportJWK`) plus a tiny DER walker that infers the algorithm from the SubjectPublicKeyInfo OID.

## Develop

```bash
npm install
npm run dev
# open http://localhost:5173/pem-to-jwk/
```

## Build

```bash
npm run build
npm run preview
```

The base path is `/pem-to-jwk/` (set in `vite.config.ts`) to match GitHub Pages project-page deployment. Change it if you deploy at a domain root.

## Supported PEM formats

- `-----BEGIN PUBLIC KEY-----` (SPKI)
- `-----BEGIN PRIVATE KEY-----` (PKCS#8)
- `-----BEGIN CERTIFICATE-----` (X.509)

PKCS#1 (`RSA PRIVATE KEY` / `RSA PUBLIC KEY`), SEC1 (`EC PRIVATE KEY`), and `ENCRYPTED PRIVATE KEY` are not supported. The app detects them and shows the `openssl` command to convert.
