"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
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
import { Textarea } from "@workspace/ui/components/textarea"
import {
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
  Smile,
  Check,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { MessageThread } from "./message-thread"
import { useAuth } from "@/hooks/use-auth"
import { Message } from "./message-list"

interface MessageItemProps {
  message: Message
  projectId: Id<"projects">
  isReply?: boolean
}

const COMMON_EMOJIS = ["👍", "❤️", "😊", "🎉", "🚀", "👏"]

export function MessageItem({
  message,
  projectId,
  isReply = false,
}: MessageItemProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showThread, setShowThread] = useState(false)

  const updateMessage = useMutation(api.messages.update)
  const deleteMessage = useMutation(api.messages.remove)
  const addReaction = useMutation(api.messages.addReaction)
  const threadMessages = useQuery(
    api.messages.getThread,
    showThread ? { threadId: message._id } : "skip"
  )

  const isAuthor = user?._id === message.authorId

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      toast.error("Message cannot be empty")
      return
    }

    try {
      await updateMessage({
        messageId: message._id,
        content: editContent.trim(),
      })
      setIsEditing(false)
      toast.success("Message updated")
    } catch (error) {
      console.error("Failed to update message:", error)
      toast.error("Failed to update message")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return
    }

    try {
      await deleteMessage({ messageId: message._id })
      toast.success("Message deleted")
    } catch (error) {
      console.error("Failed to delete message:", error)
      toast.error("Failed to delete message")
    }
  }

  const handleReaction = async (emoji: string) => {
    try {
      await addReaction({
        messageId: message._id,
        emoji,
      })
    } catch (error) {
      console.error("Failed to add reaction:", error)
      toast.error("Failed to add reaction")
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.charAt(0).toUpperCase()
  }

  const groupedReactions = message.reactions?.reduce(
    (acc, { emoji, userId }) => {
      if (!acc[emoji]) {
        acc[emoji] = []
      }
      acc[emoji].push(userId)
      return acc
    },
    {} as Record<string, Id<"users">[]>
  )

  return (
    <div className={isReply ? "ml-12" : ""}>
      <div className="group flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={message.author?.image} />
          <AvatarFallback>
            {getInitials(
              message.author?.name ?? null,
              message.author?.email ?? "U"
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">
              {message.author?.name || message.author?.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(message.createdAt, { addSuffix: true })}
              {message.updatedAt && " (edited)"}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-15"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate}>
                  <Check className="mr-1 h-4 w-4" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(message.content)
                  }}
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm wrap-break-word whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(groupedReactions).map(([emoji, userIds]) => (
                <Button
                  key={emoji}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleReaction(emoji)}
                >
                  <span>{emoji}</span>
                  <span className="ml-1 text-xs">{userIds.length}</span>
                </Button>
              ))}
            </div>
          )}

          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Smile className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="flex gap-1 min-w-fit">
                {COMMON_EMOJIS.map((emoji) => (
                  <DropdownMenuItem
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                  >
                    <span className="text-lg">{emoji}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowThread(!showThread)}
              >
                <MessageSquare className="h-4 w-4" />
                {threadMessages && threadMessages.length > 0 && (
                  <span className="ml-1 text-xs">{threadMessages.length}</span>
                )}
              </Button>
            )}

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {showThread && !isReply && (
        <MessageThread
          threadId={message._id}
          projectId={projectId}
          onClose={() => setShowThread(false)}
        />
      )}
    </div>
  )
}
