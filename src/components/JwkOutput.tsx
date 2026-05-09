import { useEffect, useState } from "react"
import { JsonView, defaultStyles } from "react-json-view-lite"
import "react-json-view-lite/dist/index.css"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ErrorMessage } from "@/components/ErrorMessage"
import { X509MetaPanel } from "@/components/X509MetaPanel"
import { convertPemToJwk, type ConvertResult } from "@/lib/pem-to-jwk"

interface JwkOutputProps {
  pem: string
}

const oneDarkStyles: typeof defaultStyles = {
  ...defaultStyles,
  container: "decode-tree-container font-mono text-[13px] leading-relaxed",
  basicChildStyle: "ml-3.5",
  label: "text-[#e06c75] font-medium mr-1",
  nullValue: "text-[#6b737c]",
  undefinedValue: "text-[#6b737c]",
  numberValue: "text-[#61afef]",
  stringValue: "text-[#98c379]",
  booleanValue: "text-[#e5c07b]",
  otherValue: "text-[#6b737c]",
  punctuation: "text-[#6b737c]",
  collapseIcon: "text-[#6b737c] hover:text-foreground cursor-pointer mr-1",
  expandIcon: "text-[#6b737c] hover:text-foreground cursor-pointer mr-1",
  collapsedContent: "text-[#6b737c] cursor-pointer",
  noQuotesForStringValues: false,
}

export function JwkOutput({ pem }: JwkOutputProps) {
  const [result, setResult] = useState<ConvertResult | null>(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const trimmed = pem.trim()
    if (!trimmed) {
      setResult(null)
      setPending(false)
      return
    }
    setPending(true)
    convertPemToJwk(trimmed).then((r) => {
      if (cancelled) return
      setResult(r)
      setPending(false)
    })
    return () => {
      cancelled = true
    }
  }, [pem])

  const handleCopy = async () => {
    if (!result || !result.ok) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.jwk, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard write may be blocked; ignore.
    }
  }

  const empty = !pem.trim()

  return (
    <section className="flex flex-col gap-2" aria-label="JWK output">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">JWK output</h2>
        {result?.ok && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              alg: {result.alg}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      {result?.ok && result.x509Meta && (
        <X509MetaPanel meta={result.x509Meta} />
      )}
      <div
        className="min-h-[200px] rounded-md border border-border bg-card p-4"
        aria-busy={pending}
        aria-live="polite"
      >
        {empty && (
          <p className="text-sm text-muted-foreground">
            Decoded JWK will appear here.
          </p>
        )}
        {!empty && pending && !result && (
          <p className="text-sm text-muted-foreground">Decoding…</p>
        )}
        {result && !result.ok && (
          <ErrorMessage title={result.error} suggestion={result.suggestion} />
        )}
        {result && result.ok && (
          <JsonView
            data={result.jwk as object}
            shouldExpandNode={() => true}
            style={oneDarkStyles}
          />
        )}
      </div>
    </section>
  )
}
