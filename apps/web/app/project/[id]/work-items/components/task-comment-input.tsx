"use client"

import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { useMutation, useQuery } from "convex/react"
import { FileIcon, Paperclip, Send, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { MentionAutocomplete } from "../../messages/components/mention-autocomplete"

interface TaskCommentInputProps {
  projectId: Id<"projects">
  taskId: Id<"tasks">
  threadId?: Id<"taskComments">
  initialValue?: string
  mode?: "create" | "edit"
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  onSubmitted?: () => void
  commentId?: Id<"taskComments">
}

export function TaskCommentInput({
  projectId,
  taskId,
  threadId,
  initialValue = "",
  mode = "create",
  submitLabel = "Comment",
  cancelLabel = "Cancel",
  onCancel,
  onSubmitted,
  commentId,
}: TaskCommentInputProps) {
  const [content, setContent] = useState(initialValue)
  const [attachments, setAttachments] = useState<
    Array<{
      storageId: Id<"_storage">
      name: string
      type: string
      size: number
    }>
  >([])
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mentionSearch, setMentionSearch] = useState<{
    query: string
    position: { top: number; left: number }
    startIndex: number
  } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createComment = useMutation(api.taskComments.create)
  const updateComment = useMutation(api.taskComments.update)
  const generateUploadUrl = useMutation(api.tasks.generateAttachmentUploadUrl)
  const members = useQuery(api.mentions.getProjectMembers, { projectId })

  useEffect(() => {
    setContent(initialValue)
  }, [initialValue])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      if (!textAfterAt.includes(" ") && textAfterAt.length < 50) {
        const rect = textarea.getBoundingClientRect()
        setMentionSearch({
          query: textAfterAt,
          position: {
            top: Math.min(rect.top - 280, 100),
            left: 16,
          },
          startIndex: lastAtIndex,
        })
        return
      }
    }

    setMentionSearch(null)
  }, [content])

  const memberLookup = useMemo(() => {
    return new Map(
      (members ?? []).flatMap((member) => {
        const keys = [`@${member.email.toLowerCase()}`]
        if (member.name) {
          keys.push(`@${member.name.toLowerCase()}`)
        }
        return keys.map((key) => [key, member._id] as const)
      })
    )
  }, [members])

  const extractMentionIds = (value: string) => {
    const matches = value.match(/@[^\s]+(?:\s+[^\s]+)?/g) ?? []
    const ids = new Set<Id<"users">>()

    for (const match of matches) {
      const memberId = memberLookup.get(match.toLowerCase().trim())
      if (memberId) {
        ids.add(memberId)
      }
    }

    return [...ids]
  }

  const handleMentionSelect = (user: {
    _id: Id<"users">
    name: string | null
    email: string
  }) => {
    if (!mentionSearch || !textareaRef.current) return

    const beforeMention = content.substring(0, mentionSearch.startIndex)
    const afterCursor = content.substring(textareaRef.current.selectionStart)
    const mentionText = `@${user.name || user.email} `
    const nextValue = beforeMention + mentionText + afterCursor

    setContent(nextValue)
    setMentionSearch(null)

    setTimeout(() => {
      const newPos = beforeMention.length + mentionText.length
      textareaRef.current?.setSelectionRange(newPos, newPos)
      textareaRef.current?.focus()
    }, 0)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    const maxSize = 10 * 1024 * 1024
    const acceptedFiles = Array.from(files).filter((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds the 10MB limit`)
        return false
      }
      return true
    })

    if (!acceptedFiles.length) return

    setUploadingFiles((prev) => [...prev, ...acceptedFiles.map((file) => file.name)])

    try {
      const uploaded: Array<{
        storageId: Id<"_storage">
        name: string
        type: string
        size: number
      }> = []

      for (const file of acceptedFiles) {
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
        uploaded.push({
          storageId,
          name: file.name,
          type: file.type,
          size: file.size,
        })
      }

      setAttachments((prev) => [...prev, ...uploaded])
      toast.success(`${uploaded.length} file(s) attached`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload attachment")
    } finally {
      setUploadingFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === "edit") {
        if (!commentId) {
          throw new Error("Missing comment id")
        }

        await updateComment({
          commentId,
          content: content.trim(),
        })
        toast.success("Comment updated")
      } else {
        const mentionIds = extractMentionIds(content)
        await createComment({
          taskId,
          content: content.trim(),
          threadId,
          mentions: mentionIds.length ? mentionIds : undefined,
          attachments: attachments.length ? attachments : undefined,
        })
        toast.success(threadId ? "Reply added" : "Comment added")
        setContent("")
        setAttachments([])
      }

      onSubmitted?.()
    } catch (error) {
      console.error(error)
      toast.error(mode === "edit" ? "Failed to update comment" : "Failed to post comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative space-y-3 rounded-xl border bg-background p-4">
      {mentionSearch && (
        <MentionAutocomplete
          projectId={projectId}
          searchQuery={mentionSearch.query}
          onSelect={handleMentionSelect}
          position={mentionSearch.position}
        />
      )}

      {(attachments.length > 0 || uploadingFiles.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={`${attachment.storageId}-${index}`}
              className="flex max-w-xs items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm"
            >
              <FileIcon className="size-4 shrink-0" />
              <span className="truncate">{attachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => setAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
          {uploadingFiles.map((name) => (
            <div
              key={name}
              className="flex max-w-xs items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm opacity-60"
            >
              <FileIcon className="size-4 animate-pulse" />
              <span className="truncate">{name}</span>
            </div>
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={threadId ? "Write a reply..." : "Add a comment..."}
        className="min-h-28 resize-y"
        maxLength={5000}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {content.length}/5000 characters
        </p>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <Paperclip className="mr-2 size-4" />
            Attach
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
          >
            <Send className="mr-2 size-4" />
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
