import { useState } from "react"
import { AppHeader } from "@/components/AppHeader"
import { PemInput } from "@/components/PemInput"
import { JwkOutput } from "@/components/JwkOutput"
import { EducationalContent } from "@/components/EducationalContent"

function App() {
  const [pem, setPem] = useState("")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div className="mx-auto max-w-5xl px-4">
        <AppHeader />
        <main id="main-content" className="flex flex-col gap-8">
          <PemInput onPem={setPem} />
          <JwkOutput pem={pem} />
          <EducationalContent />
        </main>
      </div>
    </div>
  )
}

export default App
