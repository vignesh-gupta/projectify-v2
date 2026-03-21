"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export default function ProjectDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Project dashboard error:", error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <AlertTriangle className="size-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">
          {error.message || "Failed to load project dashboard"}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
