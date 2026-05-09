interface ErrorMessageProps {
  id?: string
  title: string
  suggestion?: string
}

export function ErrorMessage({ id, title, suggestion }: ErrorMessageProps) {
  return (
    <div
      id={id}
      role="alert"
      className="rounded-md border border-destructive/50 bg-card p-3"
    >
      <p className="text-sm font-medium text-destructive">{title}</p>
      {suggestion && (
        <p className="mt-1 text-sm text-muted-foreground">{suggestion}</p>
      )}
    </div>
  )
}
