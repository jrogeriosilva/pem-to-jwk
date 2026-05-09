# Security Policy

## Scope

**PEM → JWK** is a static, browser-only cryptographic tool. All key material is processed
client-side and never transmitted to any server. The attack surface is limited to:

- Third-party dependencies (React, jose, Tailwind, etc.)
- The DER/ASN.1 parser in `src/lib/asn1.ts`
- The PEM parsing logic in `src/lib/pem-detect.ts`

## Reporting a Vulnerability

If you believe you have found a security vulnerability, **please do not open a public
GitHub issue**. Instead, use one of the following channels:

- **GitHub private advisory**: [Report a vulnerability](../../security/advisories/new)
- **Email**: If you do not have a GitHub account, email the repository owner via their
  GitHub profile contact information.

Please include:

1. A description of the vulnerability and its potential impact.
2. Steps to reproduce or a proof-of-concept.
3. Any suggested mitigations, if known.

We aim to respond within **72 hours** and to publish a fix or advisory within **14 days**
of confirmed reproduction.

## Supported Versions

Only the latest commit on the `main` branch is actively maintained.

## Dependency Updates

Dependabot is configured to open weekly pull requests for outdated npm packages and
GitHub Actions. Security patches are merged as a priority.
