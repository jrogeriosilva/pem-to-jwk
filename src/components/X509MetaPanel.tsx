import type { X509Meta } from "@/lib/pem-to-jwk"

interface X509MetaPanelProps {
  meta: X509Meta
}

function fmtDate(d: Date): string {
  return d.toUTCString().replace(" GMT", " UTC")
}

export function X509MetaPanel({ meta }: X509MetaPanelProps) {
  return (
    <div
      role="region"
      className="rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed"
      aria-label="X.509 certificate metadata"
    >
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Certificate metadata
      </p>
      {meta.subjectCN && (
        <Row label="Subject CN" value={meta.subjectCN} />
      )}
      {meta.issuerCN && (
        <Row label="Issuer CN" value={meta.issuerCN} />
      )}
      <Row label="Not before" value={fmtDate(meta.notBefore)} />
      <Row
        label="Not after"
        value={
          <span className={meta.isExpired ? "text-destructive font-medium" : undefined}>
            {fmtDate(meta.notAfter)}
            {meta.isExpired && (
              <span
                className="ml-2 inline-flex items-center rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                role="status"
                aria-label="Certificate expired"
              >
                EXPIRED
              </span>
            )}
          </span>
        }
      />
      {meta.serial && <Row label="Serial" value={meta.serial} />}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-foreground">{value}</span>
    </div>
  )
}
