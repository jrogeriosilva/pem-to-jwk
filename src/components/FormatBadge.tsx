import { Badge } from "@/components/ui/badge"

interface FormatBadgeProps {
  label: string
}

export function FormatBadge({ label }: FormatBadgeProps) {
  return (
    <Badge variant="secondary" className="font-mono">
      {label}
    </Badge>
  )
}
