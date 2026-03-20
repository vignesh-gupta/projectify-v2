"use client"

import { Button } from "@workspace/ui/components/button"
import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-16 items-center justify-center bg-destructive/10">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Something went wrong!
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {error.message || "An error occurred while loading the dashboard."}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            Go home
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
