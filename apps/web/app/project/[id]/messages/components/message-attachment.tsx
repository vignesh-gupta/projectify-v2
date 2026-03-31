"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { FileIcon, Download } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface MessageAttachmentProps {
  attachment: {
    storageId: Id<"_storage">
    name: string
    type: string
  }
  projectId: Id<"projects">
}

export function MessageAttachment({ attachment, projectId }: MessageAttachmentProps) {
  const url = useQuery(api.messages.getAttachmentUrl, { storageId: attachment.storageId })
  const ensureMessagesFolder = useMutation(api.folders.ensureMessagesFolder)
  const router = useRouter()

  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
        <FileIcon className="h-4 w-4 animate-pulse" />
        <span className="truncate max-w-50">{attachment.name}</span>
      </div>
    )
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = attachment.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleClick = async () => {
    try {
      // Ensure messages folder exists and get its ID
      const folderId = await ensureMessagesFolder({ projectId })
      // Navigate to resources page with the folder ID
      router.push(`/project/${projectId}/resources/files?folder=${folderId}`)
    } catch (error) {
      console.error("Navigation failed:", error)
      // Fallback: navigate without folder
      router.push(`/project/${projectId}/resources`)
    }
  }

  // Check if it's an image
  const isImage = attachment.type.startsWith("image/")

  if (isImage) {
    return (
      <div className="relative group">
        <div
          onClick={handleClick}
          className="block max-w-sm rounded-lg border overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Image
            src={url}
            alt={attachment.name}
            width={300}
            height={200}
            className="object-cover w-full h-auto"
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // For non-image files
  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm max-w-xs hover:bg-accent cursor-pointer transition-colors"
    >
      <FileIcon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{attachment.name}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 shrink-0"
        onClick={handleDownload}
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  )
}
