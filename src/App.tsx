import { useState } from "react"
import { AppHeader } from "@/components/AppHeader"
import { PemInput } from "@/components/PemInput"
import { JwkOutput } from "@/components/JwkOutput"
import { EducationalContent } from "@/components/EducationalContent"

function App() {
  const [pem, setPem] = useState("")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4">
        <AppHeader />
        <main className="flex flex-col gap-8">
          <PemInput onPem={setPem} />
          <JwkOutput pem={pem} />
          <EducationalContent />
        </main>
      </div>
    </div>
  )
}

export default App
