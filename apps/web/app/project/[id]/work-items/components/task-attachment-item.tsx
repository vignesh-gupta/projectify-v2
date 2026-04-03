"use client"

import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/hooks/use-auth"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useMutation, useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { Download, Eye, FileIcon, MoreVertical, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface TaskAttachmentItemProps {
  taskId: Id<"tasks">
  attachment: {
    storageId: Id<"_storage">
    name: string
    type: string
    size: number
    uploadedBy: Id<"users">
    uploadedAt: number
  }
  uploader?: {
    _id?: Id<"users">
    name?: string | null
    email?: string
    image?: string
  }
  onPreview: (file: {
    name: string
    type: string
    size: number
    url: string
  }) => void
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TaskAttachmentItem({
  taskId,
  attachment,
  uploader,
  onPreview,
}: TaskAttachmentItemProps) {
  const { user } = useAuth()
  const removeAttachment = useMutation(api.tasks.removeAttachment)
  const previewUrl = useQuery(api.tasks.getAttachmentUrl, {
    storageId: attachment.storageId,
  })

  const handleDownload = async () => {
    if (!previewUrl) return
    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      toast.error("Failed to download attachment")
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${attachment.name}?`)) return
    try {
      await removeAttachment({
        taskId,
        storageId: attachment.storageId,
      })
      toast.success("Attachment removed")
    } catch (error) {
      console.error(error)
      toast.error("Failed to remove attachment")
    }
  }

  const preview = () => {
    if (!previewUrl) return
    onPreview({
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
      url: previewUrl,
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileIcon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(attachment.size)} • {attachment.type || "Unknown type"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="size-5">
              <AvatarImage src={uploader?.image} />
              <AvatarFallback>
                {uploader?.name?.charAt(0).toUpperCase() ||
                  uploader?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            <span>
              Uploaded by{" "}
              {uploader?._id === user?._id
                ? "you"
                : uploader?.name || uploader?.email || "a teammate"}{" "}
              {formatDistanceToNow(attachment.uploadedAt, { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={preview}
          disabled={!previewUrl}
        >
          <Eye className="mr-2 size-4" />
          Preview
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={preview} disabled={!previewUrl}>
              <Eye className="mr-2 size-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload} disabled={!previewUrl}>
              <Download className="mr-2 size-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
