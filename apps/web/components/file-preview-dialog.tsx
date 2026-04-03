"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Download, ExternalLink, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: {
    name: string
    type: string
    url: string
    size?: number
  } | null
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getExtension = (name: string) => {
  const parts = name.split(".")
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? "" : ""
}

const isTextLikeFile = (type: string, name: string) => {
  const ext = getExtension(name)
  if (type.startsWith("text/")) return true
  if (
    [
      "json",
      "js",
      "jsx",
      "ts",
      "tsx",
      "md",
      "css",
      "html",
      "py",
      "java",
      "go",
      "rs",
      "sh",
      "yml",
      "yaml",
      "xml",
      "sql",
    ].includes(ext)
  ) {
    return true
  }
  return false
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
}: FilePreviewDialogProps) {
  const [textContent, setTextContent] = useState<string | null>(null)
  const [isLoadingText, setIsLoadingText] = useState(false)

  const kind = useMemo(() => {
    if (!file) return "unknown"
    if (file.type.startsWith("image/")) return "image"
    if (file.type === "application/pdf") return "pdf"
    if (file.type.startsWith("video/")) return "video"
    if (file.type.startsWith("audio/")) return "audio"
    if (isTextLikeFile(file.type, file.name)) return "text"
    return "other"
  }, [file])

  useEffect(() => {
    let isMounted = true

    const loadText = async () => {
      if (!open || !file || kind !== "text") {
        setTextContent(null)
        return
      }

      setIsLoadingText(true)
      try {
        const response = await fetch(file.url)
        const content = await response.text()
        if (isMounted) {
          setTextContent(content)
        }
      } catch (error) {
        console.error("Failed to preview file:", error)
        if (isMounted) {
          setTextContent("Preview unavailable. Use download instead.")
        }
      } finally {
        if (isMounted) {
          setIsLoadingText(false)
        }
      }
    }

    loadText()

    return () => {
      isMounted = false
    }
  }, [file, kind, open])

  const handleDownload = async () => {
    if (!file) return

    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Failed to download file")
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:min-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="truncate">{file.name}</DialogTitle>
              <DialogDescription className="truncate">
                {[file.type || "Unknown type", formatFileSize(file.size)]
                  .filter(Boolean)
                  .join(" • ")}
              </DialogDescription>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 size-4" />
                Download
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={file.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Open
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-105 bg-muted/20 p-4">
          {kind === "image" && (
            <div className="flex h-[70vh] items-center justify-center overflow-auto rounded-lg border bg-background p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.url}
                alt={file.name}
                className="max-h-full max-w-full rounded-md object-contain"
              />
            </div>
          )}

          {kind === "pdf" && (
            <iframe
              src={file.url}
              title={file.name}
              className="h-[70vh] w-full rounded-lg border bg-background"
            />
          )}

          {kind === "video" && (
            <div className="flex h-[70vh] items-center justify-center rounded-lg border bg-background p-4">
              <video
                src={file.url}
                controls
                className="max-h-full max-w-full rounded-md"
              />
            </div>
          )}

          {kind === "audio" && (
            <div className="flex h-55 items-center justify-center rounded-lg border bg-background p-6">
              <audio src={file.url} controls className="w-full max-w-2xl" />
            </div>
          )}

          {kind === "text" && (
            <div className="rounded-lg border bg-background">
              {isLoadingText ? (
                <div className="flex h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading preview...
                </div>
              ) : (
                <ScrollArea className="h-[70vh]">
                  <pre className="overflow-x-auto p-4 text-sm leading-6 whitespace-pre-wrap">
                    {textContent}
                  </pre>
                </ScrollArea>
              )}
            </div>
          )}

          {kind === "other" && (
            <div className="flex h-80 flex-col items-center justify-center gap-4 rounded-lg border bg-background p-8 text-center">
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview is not available for this file type.</p>
                <p className="text-sm text-muted-foreground">
                  You can still open or download the file.
                </p>
              </div>
              <Button onClick={handleDownload}>
                <Download className="mr-2 size-4" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
