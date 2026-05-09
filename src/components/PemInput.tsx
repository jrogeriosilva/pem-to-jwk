import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ClipboardPaste, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ErrorMessage } from "@/components/ErrorMessage"
import { FormatBadge } from "@/components/FormatBadge"
import { SamplePayloadsMenu } from "@/components/SamplePayloadsMenu"
import { detectPem, MAX_PEM_BYTES, type PemDetectResult } from "@/lib/pem-detect"
import { debounce } from "@/lib/debounce"
import type { SamplePem } from "@/lib/samples"

const ACCEPTED_EXTENSIONS = [".pem", ".crt", ".key", ".pub", ".cer", ".p8"]

interface PemInputProps {
  onPem: (pem: string) => void
}

export function PemInput({ onPem }: PemInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const [input, setInput] = useState("")
  const [detected, setDetected] = useState<PemDetectResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`
  }, [])

  const applyText = useCallback(
    (value: string) => {
      setInput(value)
      requestAnimationFrame(adjustHeight)
      onPem(value)
      if (!value.trim()) {
        setDetected(null)
        return
      }
      setDetected(detectPem(value))
    },
    [onPem, adjustHeight],
  )

  const detectImmediate = useCallback(
    (value: string) => {
      onPem(value)
      if (!value.trim()) {
        setDetected(null)
        return
      }
      setDetected(detectPem(value))
    },
    [onPem],
  )

  const debouncedDetect = useMemo(
    () => debounce((value: string) => detectImmediate(value), 300),
    [detectImmediate],
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
      applyText(text)
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
    applyText(sample.pem)
  }

  const loadFile = async (file: File) => {
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase()
    const isAccepted =
      ACCEPTED_EXTENSIONS.includes(ext) ||
      file.type === "text/plain" ||
      file.type === ""
    if (!isAccepted) return
    const text = await file.text()
    applyText(text)
    textareaRef.current?.focus()
  }

  // ── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)
    // `files` is empty for synthetic Playwright events; fall back to `items`
    let file: File | null | undefined = e.dataTransfer.files[0]
    if (!file && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]
      if (item.kind === "file") file = item.getAsFile()
    }
    if (file) await loadFile(file)
  }

  // ── File input fallback ───────────────────────────────────────────────────

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await loadFile(file)
    // Reset so the same file can be re-selected
    e.target.value = ""
  }

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  const successLabel = detected?.ok ? detected.headerLabel : null
  const errorTitle = detected && !detected.ok ? detected.error : null
  const errorSuggestion = detected && !detected.ok ? detected.suggestion : undefined

  return (
    <div
      className="flex flex-col gap-2"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid="pem-dropzone"
    >
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          spellCheck={false}
          maxLength={MAX_PEM_BYTES}
          placeholder="Paste a PEM block here — -----BEGIN PUBLIC KEY-----, -----BEGIN PRIVATE KEY-----, or -----BEGIN CERTIFICATE-----"
          className="min-h-[120px] max-h-[320px] resize-none bg-card border-border font-mono text-sm"
          aria-label="PEM-encoded key or certificate input"
          aria-describedby={errorTitle ? "pem-input-error" : undefined}
        />
        {isDragging && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/10"
            aria-hidden="true"
          >
            <span className="rounded bg-background/90 px-3 py-1.5 text-sm font-medium text-primary shadow">
              Drop .pem file here
            </span>
          </div>
        )}
      </div>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload a PEM file"
        >
          <Upload />
          Upload file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",") + ",text/plain"}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleFileInputChange}
        />
        <SamplePayloadsMenu onSelect={handleLoadSample} />
        <div className="flex-1" />
        {successLabel && <FormatBadge label={successLabel} />}
      </div>
      {errorTitle && (
        <ErrorMessage id="pem-input-error" title={errorTitle} suggestion={errorSuggestion} />
      )}
    </div>
  )
}
