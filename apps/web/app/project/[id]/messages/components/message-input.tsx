"use client"

import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { useMutation } from "convex/react"
import { FileIcon, Paperclip, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { MentionAutocomplete } from "./mention-autocomplete"

interface MessageInputProps {
  projectId: Id<"projects">
  threadId?: Id<"messages">
  onSent?: () => void
  placeholder?: string
}

interface MentionUser {
  _id: Id<"users">
  name: string | null
  email: string
  image?: string
}

export function MessageInput({
  projectId,
  threadId,
  onSent,
  placeholder = "Type your message...",
}: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<
    Array<{
      storageId: Id<"_storage">
      name: string
      type: string
    }>
  >([])
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [mentionSearch, setMentionSearch] = useState<{
    query: string
    position: { top: number; left: number }
    startIndex: number
  } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sendMessage = useMutation(api.messages.send)
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl)
  const setTyping = useMutation(api.typing.setTyping)

  // Handle typing indicator
  useEffect(() => {
    if (content.trim()) {
      // User is typing
      setTyping({ projectId, isTyping: true }).catch(console.error)

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set timeout to stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping({ projectId, isTyping: false }).catch(console.error)
      }, 3000)
    } else {
      // User cleared the input
      setTyping({ projectId, isTyping: false }).catch(console.error)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [content, projectId, setTyping])

  // Detect @ mentions
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Check if there's a space after @ (which would close the mention)
      if (!textAfterAt.includes(" ") && textAfterAt.length < 50) {
        // Get cursor position relative to viewport
        const rect = textarea.getBoundingClientRect()
        // Position dropdown above the textarea, accounting for its height
        // Use Math.max to ensure it doesn't go off top of screen
        const dropdownHeight = 280
        const position = {
          top: Math.min(rect.top - dropdownHeight, 100), // Ensure minimum 100px from top
          left: 16,
        }

        console.log(position, rect)

        setMentionSearch({
          query: textAfterAt,
          position,
          startIndex: lastAtIndex,
        })
        return
      }
    }

    setMentionSearch(null)
  }, [content])

  const handleMentionSelect = (user: MentionUser) => {
    if (!mentionSearch || !textareaRef.current) return

    const beforeMention = content.substring(0, mentionSearch.startIndex)
    const afterCursor = content.substring(textareaRef.current.selectionStart)
    const mentionText = `@${user.name || user.email} `

    const newContent = beforeMention + mentionText + afterCursor
    setContent(newContent)

    // Set cursor position after mention
    setTimeout(() => {
      const newPos = beforeMention.length + mentionText.length
      textareaRef.current?.setSelectionRange(newPos, newPos)
      textareaRef.current?.focus()
    }, 0)

    setMentionSearch(null)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Limit file size to 10MB
    const maxSize = 10 * 1024 * 1024
    const validFiles: File[] = []

    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
      } else {
        validFiles.push(file)
      }
    }

    if (validFiles.length === 0) return

    setUploadingFiles((prev) => [...prev, ...validFiles.map((f) => f.name)])

    try {
      const uploadedFiles: Array<{
        storageId: Id<"_storage">
        name: string
        type: string
      }> = []

      for (const file of validFiles) {
        const uploadUrl = await generateUploadUrl()
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!result.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const { storageId } = await result.json()
        uploadedFiles.push({
          storageId,
          name: file.name,
          type: file.type,
        })
      }

      setAttachments((prev) => [...prev, ...uploadedFiles])
      toast.success(`${validFiles.length} file(s) uploaded successfully`)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload files")
    } finally {
      setUploadingFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && attachments.length === 0) {
      return
    }

    setIsSending(true)

    try {
      // Stop typing indicator
      await setTyping({ projectId, isTyping: false })

      await sendMessage({
        projectId,
        content: content.trim() || "(file attachment)",
        threadId,
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      setContent("")
      setAttachments([])
      onSent?.()
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative border-t bg-background p-4"
    >
      {/* Mention autocomplete */}
      {mentionSearch && (
        <MentionAutocomplete
          projectId={projectId}
          searchQuery={mentionSearch.query}
          onSelect={handleMentionSelect}
          position={mentionSearch.position}
        />
      )}

      {/* Attachment previews */}
      {(attachments.length > 0 || uploadingFiles.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex max-w-xs items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm"
            >
              <FileIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{attachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 p-0 hover:bg-destructive/10"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {uploadingFiles.map((name, index) => (
            <div
              key={`uploading-${index}`}
              className="flex max-w-xs items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm opacity-60"
            >
              <FileIcon className="h-4 w-4 shrink-0 animate-pulse" />
              <span className="truncate">{name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="max-h-50 min-h-15 resize-none pr-10"
            disabled={isSending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isSending || uploadingFiles.length > 0}
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={
              (!content.trim() && attachments.length === 0) || isSending
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  )
}
