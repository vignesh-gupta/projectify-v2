"use client"

import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { useMutation } from "convex/react"
import { Loader2, Paperclip, UploadCloud } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

interface TaskAttachmentUploadProps {
  taskId: Id<"tasks">
}

export function TaskAttachmentUpload({ taskId }: TaskAttachmentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const generateUploadUrl = useMutation(api.tasks.generateAttachmentUploadUrl)
  const addAttachment = useMutation(api.tasks.addAttachment)

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return

    const maxSize = 10 * 1024 * 1024
    const acceptedFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds the 10MB limit`)
        return false
      }
      return true
    })

    if (!acceptedFiles.length) return

    setIsUploading(true)
    setProgress(0)

    try {
      for (let index = 0; index < acceptedFiles.length; index += 1) {
        const file = acceptedFiles[index]!
        const uploadUrl = await generateUploadUrl()
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        })

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`)
        }

        const { storageId } = await response.json()
        await addAttachment({
          taskId,
          storageId,
          name: file.name,
          type: file.type,
          size: file.size,
        })

        setProgress(Math.round(((index + 1) / acceptedFiles.length) * 100))
      }

      toast.success(`${acceptedFiles.length} attachment(s) uploaded`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload attachment")
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 500)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <div
      className={`rounded-xl border border-dashed p-4 transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        uploadFiles(Array.from(event.dataTransfer.files))
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => uploadFiles(Array.from(event.target.files ?? []))}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UploadCloud className="size-4" />
            Add attachments
          </div>
          <p className="text-sm text-muted-foreground">
            Drag files here or browse from your device. Maximum 10MB per file.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Paperclip className="mr-2 size-4" />
          )}
          {isUploading ? "Uploading..." : "Choose files"}
        </Button>
      </div>

      {isUploading && (
        <div className="mt-4 space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">{progress}% complete</p>
        </div>
      )}
    </div>
  )
}
