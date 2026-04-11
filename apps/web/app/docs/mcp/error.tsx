"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

type McpDocsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function McpDocsError({ error, reset }: McpDocsErrorProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <h1 className="text-2xl font-semibold">Unable to load MCP docs</h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}

