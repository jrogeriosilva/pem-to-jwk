export function AppHeader() {
  return (
    <header className="flex items-center justify-between py-6 px-4">
      <div>
        <h1 className="text-xl font-semibold leading-tight">PEM → JWK</h1>
        <p className="text-sm text-muted-foreground">
          Convert PEM-encoded keys & certificates to JSON Web Key — runs entirely in your browser
        </p>
      </div>
    </header>
  )
}
