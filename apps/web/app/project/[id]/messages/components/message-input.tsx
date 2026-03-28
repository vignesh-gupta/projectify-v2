"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Send, Paperclip } from "lucide-react"
import { toast } from "sonner"

interface MessageInputProps {
  projectId: Id<"projects">
  threadId?: Id<"messages">
  onSent?: () => void
  placeholder?: string
}

export function MessageInput({
  projectId,
  threadId,
  onSent,
  placeholder = "Type your message...",
}: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)

  const sendMessage = useMutation(api.messages.send)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    setIsSending(true)

    try {
      await sendMessage({
        projectId,
        content: content.trim(),
        threadId,
      })

      setContent("")
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
      className="border-t bg-background p-4"
    >
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] max-h-[200px] resize-none"
          disabled={isSending}
        />
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isSending}
            title="Attach file (coming soon)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={!content.trim() || isSending}
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
