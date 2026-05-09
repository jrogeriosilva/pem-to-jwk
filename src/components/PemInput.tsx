import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ClipboardPaste, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ErrorMessage } from "@/components/ErrorMessage"
import { FormatBadge } from "@/components/FormatBadge"
import { SamplePayloadsMenu } from "@/components/SamplePayloadsMenu"
import { detectPem, MAX_PEM_BYTES, type PemDetectResult } from "@/lib/pem-detect"
import { debounce } from "@/lib/debounce"
import type { SamplePem } from "@/lib/samples"

interface PemInputProps {
  onPem: (pem: string) => void
}

export function PemInput({ onPem }: PemInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState("")
  const [detected, setDetected] = useState<PemDetectResult | null>(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`
  }, [])

  const detectImmediate = useCallback(
    (value: string) => {
      onPem(value)
      if (!value.trim()) {
        setDetected(null)
        return
      }
      setDetected(detectPem(value))
    },
    [onPem]
  )

  const debouncedDetect = useMemo(
    () => debounce((value: string) => detectImmediate(value), 300),
    [detectImmediate]
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    adjustHeight()
    debouncedDetect(value)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInput(text)
      requestAnimationFrame(adjustHeight)
      detectImmediate(text)
      textareaRef.current?.focus()
    } catch {
      // Clipboard read may be blocked; ignore.
    }
  }

  const handleClear = () => {
    setInput("")
    setDetected(null)
    onPem("")
    if (textareaRef.current) {
      textareaRef.current.value = ""
      textareaRef.current.style.height = "auto"
      textareaRef.current.focus()
    }
  }

  const handleLoadSample = (sample: SamplePem) => {
    setInput(sample.pem)
    requestAnimationFrame(adjustHeight)
    detectImmediate(sample.pem)
  }

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  const successLabel = detected?.ok ? detected.headerLabel : null
  const errorTitle = detected && !detected.ok ? detected.error : null
  const errorSuggestion = detected && !detected.ok ? detected.suggestion : undefined

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        spellCheck={false}
        maxLength={MAX_PEM_BYTES}
        placeholder="Paste a PEM block here — -----BEGIN PUBLIC KEY-----, -----BEGIN PRIVATE KEY-----, or -----BEGIN CERTIFICATE-----"
        className="min-h-[120px] max-h-[320px] resize-none bg-card border-border font-mono text-sm"
      />
      <div className="flex flex-wrap items-center gap-2 min-h-[28px]">
        <Button variant="outline" size="sm" onClick={handlePaste}>
          <ClipboardPaste />
          Paste
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!input}
        >
          <X />
          Clear
        </Button>
        <SamplePayloadsMenu onSelect={handleLoadSample} />
        <div className="flex-1" />
        {successLabel && <FormatBadge label={successLabel} />}
      </div>
      {errorTitle && (
        <ErrorMessage title={errorTitle} suggestion={errorSuggestion} />
      )}
    </div>
  )
}
