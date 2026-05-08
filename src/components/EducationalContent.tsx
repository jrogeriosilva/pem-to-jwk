export function EducationalContent() {
  return (
    <section className="mt-16 border-t border-border pt-12 pb-16 space-y-10">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">What is a JWK?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A <strong className="text-foreground">JSON Web Key</strong> (JWK, RFC 7517)
          is a JSON object that represents a cryptographic key. It encodes the
          same key material as a PEM file, but in a format that JavaScript and
          web APIs can consume directly. JWKs are the canonical key format for
          OAuth 2.0, OpenID Connect, JWS/JWE, and WebAuthn.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Supported PEM formats</h2>
        <dl className="space-y-3">
          <div>
            <dt className="font-mono text-xs text-foreground font-medium">
              -----BEGIN PUBLIC KEY-----
            </dt>
            <dd className="mt-0.5 pl-3 text-sm text-muted-foreground">
              SubjectPublicKeyInfo (SPKI). Wraps RSA, EC, Ed25519, and X25519
              public keys with an AlgorithmIdentifier OID. The standard format
              produced by{" "}
              <code className="font-mono text-xs bg-muted px-1 rounded">
                openssl pkey -pubout
              </code>
              .
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-foreground font-medium">
              -----BEGIN PRIVATE KEY-----
            </dt>
            <dd className="mt-0.5 pl-3 text-sm text-muted-foreground">
              PKCS#8 (RFC 5208). Algorithm-agnostic envelope for any private
              key. Use{" "}
              <code className="font-mono text-xs bg-muted px-1 rounded">
                openssl pkcs8 -topk8 -nocrypt
              </code>{" "}
              to convert legacy formats.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-foreground font-medium">
              -----BEGIN CERTIFICATE-----
            </dt>
            <dd className="mt-0.5 pl-3 text-sm text-muted-foreground">
              X.509 certificate. The converter extracts the SubjectPublicKeyInfo
              and emits its JWK — the certificate metadata (subject, issuer,
              extensions) is not included in the JWK.
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Not supported</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">PKCS#1</strong> (
            <code className="font-mono text-xs bg-muted px-1 rounded">
              RSA PRIVATE KEY
            </code>{" "}
            /{" "}
            <code className="font-mono text-xs bg-muted px-1 rounded">
              RSA PUBLIC KEY
            </code>
            ) — the legacy RSA-only format.
          </li>
          <li>
            <strong className="text-foreground">SEC1</strong> (
            <code className="font-mono text-xs bg-muted px-1 rounded">
              EC PRIVATE KEY
            </code>
            ) — the legacy EC-only format.
          </li>
          <li>
            <strong className="text-foreground">Encrypted PEM</strong> (
            <code className="font-mono text-xs bg-muted px-1 rounded">
              ENCRYPTED PRIVATE KEY
            </code>
            ) — decrypt locally first.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          When one of these is detected the tool shows the exact{" "}
          <code className="font-mono text-xs bg-muted px-1 rounded">openssl</code>{" "}
          command to convert it to a supported format.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Privacy</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Conversion runs entirely in your browser using the Web Crypto API
          (via the <code className="font-mono text-xs bg-muted px-1 rounded">jose</code>{" "}
          library). Nothing is uploaded — you can verify by opening the network
          tab while pasting a key. Still, treat private keys with care: paste
          test keys, not production secrets.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <dl className="space-y-5">
          <div>
            <dt className="text-sm font-semibold text-foreground">
              How is the algorithm determined?
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              The AlgorithmIdentifier OID inside the DER-encoded
              SubjectPublicKeyInfo / PrivateKeyInfo is read directly. For EC
              keys the curve OID picks the JOSE alg
              (P-256 → ES256, P-384 → ES384, P-521 → ES512).
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-foreground">
              Why are private keys exported with all the CRT parameters?
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              RFC 7518 requires RSA private JWKs to include{" "}
              <code className="font-mono text-xs bg-muted px-1 rounded">d</code>,
              and recommends{" "}
              <code className="font-mono text-xs bg-muted px-1 rounded">p, q, dp, dq, qi</code>{" "}
              for performance. Web Crypto exports them by default.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-foreground">
              Does this support JWK → PEM?
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              Not yet. This tool is one-way (PEM → JWK).
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
