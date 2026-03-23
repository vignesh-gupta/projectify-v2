"use client"

import { useState } from "react"
import {
  X,
  FileIcon,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface UploadItem {
  id: string
  name: string
  progress: number
  status: "uploading" | "complete" | "error"
  size?: number
}

interface UploadProgressPanelProps {
  uploads: UploadItem[]
  onCancel: (id: string) => void
  onDismiss: (id: string) => void
}

export function UploadProgressPanel({
  uploads,
  onCancel,
  onDismiss,
}: UploadProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (uploads.length === 0) return null

  const uploadingCount = uploads.filter((u) => u.status === "uploading").length
  const completeCount = uploads.filter((u) => u.status === "complete").length
  const errorCount = uploads.filter((u) => u.status === "error").length

  // Calculate overall progress
  const totalProgress = uploads.reduce((acc, u) => acc + u.progress, 0)
  const avgProgress =
    uploads.length > 0 ? Math.round(totalProgress / uploads.length) : 0

  const hasActiveUploads = uploadingCount > 0

  return (
    <div className="fixed right-4 bottom-4 z-50 w-96">
      <Card
        className={cn(
          "border-2 shadow-xl transition-all",
          hasActiveUploads && "border-primary/50",
          !hasActiveUploads && completeCount > 0 && "border-green-500/50",
          errorCount > 0 && !hasActiveUploads && "border-red-500/50"
        )}
      >
        {/* Header */}
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {hasActiveUploads
                    ? `Uploading ${uploadingCount} file${uploadingCount !== 1 ? "s" : ""}`
                    : "Uploads"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {completeCount > 0 && `${completeCount} complete`}
                  {completeCount > 0 && errorCount > 0 && " • "}
                  {errorCount > 0 && `${errorCount} failed`}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
              </Button>
              {!hasActiveUploads && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    uploads.forEach((u) => onDismiss(u.id))
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Dismiss all</span>
                </Button>
              )}
            </div>
          </div>

          {/* Overall Progress Bar (when uploading) */}
          {hasActiveUploads && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
          )}
        </CardHeader>

        {/* File List (Collapsible) */}
        {isExpanded && (
          <CardContent className="max-h-80 space-y-2 overflow-y-auto p-3 pt-1">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={cn(
                  "rounded-lg border p-2 transition-colors",
                  upload.status === "complete" &&
                    "border-green-500/30 bg-green-500/5",
                  upload.status === "error" && "border-red-500/30 bg-red-500/5",
                  upload.status === "uploading" && "border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Status Icon */}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {upload.status === "complete" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : upload.status === "error" ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {upload.name}
                    </p>
                    {upload.status === "uploading" && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {upload.progress}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 shrink-0 p-0"
                    onClick={() => {
                      if (upload.status === "uploading") {
                        onCancel(upload.id)
                      } else {
                        onDismiss(upload.id)
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">
                      {upload.status === "uploading" ? "Cancel" : "Dismiss"}
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
