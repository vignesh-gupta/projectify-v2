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
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { useMutation, useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import {
  Check,
  MessageSquare,
  MoreVertical,
  Pencil,
  Smile,
  Trash2,
  X,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { MessageThread } from "./message-thread"
import { MessageAttachment } from "./message-attachment"
import { Mention } from "./mention"

interface Message {
  _id: Id<"messages">
  projectId: Id<"projects">
  authorId: Id<"users">
  content: string
  threadId?: Id<"messages">
  attachments?: Array<{
    storageId: Id<"_storage">
    name: string
    type: string
  }>
  reactions?: Array<{ emoji: string; userId: Id<"users"> }>
  createdAt: number
  updatedAt?: number
  deletedAt?: number
  author: {
    _id: Id<"users">
    name: string | null
    email: string
    image?: string
  } | null
}

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
  const [isReactionDropdownOpen, setIsReactionDropdownOpen] = useState(false)

  const updateMessage = useMutation(api.messages.update)
  const deleteMessage = useMutation(api.messages.remove)
  const addReaction = useMutation(api.messages.addReaction)

  // Always fetch thread count
  const threadMessages = useQuery(api.messages.getThread, {
    threadId: message._id,
  })

  const isAuthor = user?._id === message.authorId
  const isCurrentUser = user?._id === message.authorId

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

  const getInitials = (email: string, name?: string | null) => {
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

  const replyCount = threadMessages?.length || 0

  return (
    <div className={isReply ? "ml-12" : ""}>
      <div
        className={cn(
          "group flex gap-3",
          isCurrentUser ? "flex-row-reverse" : ""
        )}
      >
        <Avatar className="mt-4 size-10 shrink-0">
          <AvatarImage src={message.author?.image} />
          <AvatarFallback>
            {getInitials(message.author?.email ?? "U", message.author?.name)}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            "flex-1 space-y-1",
            isCurrentUser ? "flex flex-col items-end" : ""
          )}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">
              {isCurrentUser
                ? "You"
                : message.author?.name || message.author?.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(message.createdAt, { addSuffix: true })}
              {message.updatedAt && " (edited)"}
            </span>
          </div>

          {isEditing ? (
            <div className="w-full space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-15"
                autoFocus
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
            <>
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm wrap-break-word whitespace-pre-wrap">
                  {message.content.split(/(@\w+(?:\s+\w+)?)/g).map((part, index) => {
                    if (part.startsWith("@")) {
                      return (
                        <Mention
                          key={index}
                          mention={part}
                          projectId={projectId}
                          className={cn(
                            "font-semibold cursor-pointer hover:underline",
                            isCurrentUser
                              ? "text-primary-foreground/90"
                              : "text-primary"
                          )}
                        />
                      )
                    }
                    return part
                  })}
                </p>
              </div>
              
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className={cn(
                  "flex flex-wrap gap-2 mt-2",
                  isCurrentUser ? "justify-end" : ""
                )}>
                  {message.attachments.map((attachment, index) => (
                    <MessageAttachment
                      key={`${attachment.storageId}-${index}`}
                      attachment={attachment}
                      projectId={projectId}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div
              className={`flex flex-wrap gap-1 ${isCurrentUser ? "justify-end" : ""}`}
            >
              {Object.entries(groupedReactions).map(([emoji, userIds]) => {
                const hasUserReacted =
                  user && userIds.some((id) => id === user._id)
                return (
                  <Button
                    key={emoji}
                    variant={hasUserReacted ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleReaction(emoji)}
                  >
                    <span>{emoji}</span>
                    <span className="ml-1 text-xs">{userIds.length}</span>
                  </Button>
                )
              })}
            </div>
          )}

          <div
            className={cn(
              "flex gap-1 transition-opacity",
              isReactionDropdownOpen
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
              isCurrentUser && "flex-row-reverse"
            )}
          >
            <DropdownMenu
              open={isReactionDropdownOpen}
              onOpenChange={setIsReactionDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Smile className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="flex min-w-fit gap-1 p-2"
                align={isCurrentUser ? "end" : "start"}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleReaction(emoji)
                      setIsReactionDropdownOpen(false)
                    }}
                    className="rounded p-1.5 transition-colors hover:bg-accent"
                    title={`React with ${emoji}`}
                  >
                    <span className="text-xl">{emoji}</span>
                  </button>
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
                {replyCount > 0 && (
                  <span className="ml-1 text-xs">{replyCount}</span>
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
                <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
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
        <MessageThread threadId={message._id} projectId={projectId} />
      )}
    </div>
  )
}
