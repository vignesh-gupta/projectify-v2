"use client"

import { useCallback, useState } from "react"
import { Upload } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

export interface UploadingFile {
  name: string
  progress: number
  status: "uploading" | "complete" | "error"
}

interface DropZoneWrapperProps {
  projectId: Id<"projects">
  folderId?: Id<"folders">
  children: React.ReactNode
  onFileDrop: (files: File[]) => void
}

export function DropZoneWrapper({ children, onFileDrop }: DropZoneWrapperProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length === 0) return

      // Pass files to parent handler
      onFileDrop(droppedFiles)
    },
    [onFileDrop]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    // Only show overlay for external file drags, not internal element drags
    const hasFiles = e.dataTransfer.types.includes("Files")
    if (hasFiles) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set to false if leaving the wrapper completely
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    // Only show overlay for external file drags, not internal element drags
    const hasFiles = e.dataTransfer.types.includes("Files")
    if (hasFiles) {
      setIsDragging(true)
    }
  }

  return (
    <div
      className="relative h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {children}

      {/* Full-page overlay when dragging - doesn't cover sidebar */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-50">
          {/* Backdrop with lower opacity */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
          
          {/* Dashed border at the edges */}
          <div className="absolute inset-0 border-4 border-dashed border-primary/50" />
          
          {/* Center content */}
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 rounded-xl bg-background/95 p-8 shadow-2xl ring-2 ring-primary/20">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold">Drop files to upload</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Files will be added to your project
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
