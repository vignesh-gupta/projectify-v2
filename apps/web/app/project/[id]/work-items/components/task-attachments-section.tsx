"use client"

import { FilePreviewDialog } from "@/components/file-preview-dialog"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { FileUp } from "lucide-react"
import { useState } from "react"
import { TaskAttachmentItem } from "./task-attachment-item"
import { TaskAttachmentUpload } from "./task-attachment-upload"

interface TaskAttachmentsSectionProps {
  taskId: Id<"tasks">
  task: {
    attachments?: Array<{
      storageId: Id<"_storage">
      name: string
      type: string
      size: number
      uploadedBy: Id<"users">
      uploadedAt: number
    }>
  }
  projectId: Id<"projects">
}

export function TaskAttachmentsSection({
  taskId,
  task,
  projectId,
}: TaskAttachmentsSectionProps) {
  const [previewFile, setPreviewFile] = useState<{
    name: string
    type: string
    url: string
    size?: number
  } | null>(null)

  const members = useQuery(api.mentions.getProjectMembers, { projectId })
  const attachments = task.attachments ?? []

  return (
    <div className="space-y-4">
      <TaskAttachmentUpload taskId={taskId} />

      {attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
          <FileUp className="mb-3 size-10 text-muted-foreground" />
          <h3 className="text-sm font-medium">No attachments yet</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Add specs, mockups, documents, or screenshots directly to this task.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <TaskAttachmentItem
              key={attachment.storageId}
              taskId={taskId}
              attachment={attachment}
              uploader={members?.find((member) => member._id === attachment.uploadedBy)}
              onPreview={(file) => setPreviewFile(file)}
            />
          ))}
        </div>
      )}

      <FilePreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPreviewFile(null)
          }
        }}
        file={previewFile}
      />
    </div>
  )
}
