import { Menu } from "@base-ui/react/menu"
import { ChevronDown, FileKey } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SAMPLE_PEMS, type SamplePem } from "@/lib/samples"

interface SamplePayloadsMenuProps {
  onSelect: (sample: SamplePem) => void
}

export function SamplePayloadsMenu({ onSelect }: SamplePayloadsMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button variant="outline" size="sm">
            <FileKey />
            Samples
            <ChevronDown className="opacity-70" />
          </Button>
        }
      />
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          <Menu.Popup className="min-w-[280px] max-w-[360px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
            {SAMPLE_PEMS.map((sample) => (
              <Menu.Item
                key={sample.id}
                onClick={() => onSelect(sample)}
                className="flex cursor-pointer flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted"
              >
                <span className="font-medium leading-tight">{sample.title}</span>
                <span className="text-xs text-muted-foreground leading-snug">
                  {sample.description}
                </span>
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
