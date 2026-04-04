"use client"

import { FilePreviewDialog } from "@/components/file-preview-dialog"
import { api } from "@/convex/_generated/api"
import { type Doc, type Id } from "@/convex/_generated/dataModel"
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
import { MessageSquareReply, MoreVertical, Pencil, Smile, Trash2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { TaskCommentInput } from "./task-comment-input"
import { TaskCommentThread } from "./task-comment-thread"

type BaseTaskComment = Omit<Doc<"taskComments">, "reactions"> & {
  reactions?: Record<string, Id<"users">[]>
}

export type TaskCommentWithReplies = BaseTaskComment & {
  author: {
    _id: Id<"users">
    name?: string | null
    email?: string
    image?: string
  } | null
  replies: Array<
    BaseTaskComment & {
      author: {
        _id: Id<"users">
        name?: string | null
        email?: string
        image?: string
      } | null
      replies?: []
    }
  >
}

interface TaskCommentItemProps {
  comment: TaskCommentWithReplies
  projectId: Id<"projects">
  taskId: Id<"tasks">
  isReply?: boolean
}

const COMMON_EMOJIS = ["👍", "❤️", "🎉", "👀", "🚀"]

export function TaskCommentItem({
  comment,
  projectId,
  taskId,
  isReply = false,
}: TaskCommentItemProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [previewStorageId, setPreviewStorageId] = useState<Id<"_storage"> | null>(
    null
  )

  const removeComment = useMutation(api.taskComments.remove)
  const toggleReaction = useMutation(api.taskComments.toggleReaction)

  const previewUrl = useQuery(
    api.tasks.getAttachmentUrl,
    previewStorageId ? { storageId: previewStorageId } : "skip"
  )

  const previewAttachment = useMemo(() => {
    if (!previewStorageId || !previewUrl) return null
    const attachment = comment.attachments?.find(
      (item) => item.storageId === previewStorageId
    )
    if (!attachment) return null

    return {
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
      url: previewUrl,
    }
  }, [comment.attachments, previewStorageId, previewUrl])

  const canEdit = user?._id === comment.authorId

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return

    try {
      await removeComment({ commentId: comment._id })
      toast.success("Comment deleted")
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete comment")
    }
  }

  const handleReaction = async (emoji: string) => {
    try {
      await toggleReaction({
        commentId: comment._id,
        emoji,
      })
    } catch (error) {
      console.error(error)
      toast.error("Failed to react")
    }
  }

  const groupedReactions = Object.entries(
    (comment.reactions as Record<string, Id<"users">[]> | undefined) ?? {}
  )

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    }
    return email?.charAt(0).toUpperCase() ?? "U"
  }

  return (
    <div className={`space-y-3 rounded-xl border bg-card p-4 ${isReply ? "bg-background" : ""}`}>
      <div className="flex items-start gap-3">
        <Avatar className="size-9">
          <AvatarImage src={comment.author?.image} />
          <AvatarFallback>
            {getInitials(comment.author?.name, comment.author?.email)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">
                  {comment.author?.name || comment.author?.email || "Unknown user"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                  {comment.updatedAt ? " (edited)" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu open={showReactions} onOpenChange={setShowReactions}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <Smile className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="flex min-w-fit gap-1 p-2">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="rounded-md p-2 text-lg hover:bg-accent"
                      onClick={() => {
                        handleReaction(emoji)
                        setShowReactions(false)
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isReply && (
                    <DropdownMenuItem onClick={() => setIsReplying((prev) => !prev)}>
                      <MessageSquareReply className="mr-2 size-4" />
                      Reply
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
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

          {isEditing ? (
            <TaskCommentInput
              mode="edit"
              projectId={projectId}
              taskId={taskId}
              commentId={comment._id}
              initialValue={comment.content}
              submitLabel="Save"
              cancelLabel="Discard"
              onCancel={() => setIsEditing(false)}
              onSubmitted={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-3">
              <div className="text-sm leading-6 whitespace-pre-wrap">
                {comment.content.split(/(@\S+(?:\s+\S+)?)/g).map((part, index) => {
                  if (part.startsWith("@")) {
                    return (
                      <span key={`${part}-${index}`} className="font-medium text-primary">
                        {part}
                      </span>
                    )
                  }
                  return <span key={`${part}-${index}`}>{part}</span>
                })}
              </div>

              {comment.attachments && comment.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {comment.attachments.map((attachment) => (
                    <button
                      key={attachment.storageId}
                      type="button"
                      onClick={() => setPreviewStorageId(attachment.storageId)}
                      className="rounded-md border bg-muted px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <p className="truncate font-medium">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{attachment.type || "File"}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {groupedReactions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {groupedReactions.map(([emoji, userIds]) => {
                const reacted = !!user && userIds.includes(user._id)
                return (
                  <Button
                    key={emoji}
                    variant={reacted ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleReaction(emoji)}
                  >
                    <span>{emoji}</span>
                    <span className="ml-1 text-xs">{userIds.length}</span>
                  </Button>
                )
              })}
            </div>
          )}

          {!isReply && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setIsReplying((prev) => !prev)}
                >
                  {isReplying ? <X className="mr-1 size-4" /> : <MessageSquareReply className="mr-1 size-4" />}
                  {isReplying ? "Cancel reply" : "Reply"}
                </Button>
                {comment.replies.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {comment.replies.length} repl{comment.replies.length === 1 ? "y" : "ies"}
                  </span>
                )}
              </div>

              {isReplying && (
                <TaskCommentInput
                  projectId={projectId}
                  taskId={taskId}
                  threadId={comment._id}
                  submitLabel="Reply"
                  onCancel={() => setIsReplying(false)}
                  onSubmitted={() => setIsReplying(false)}
                />
              )}

              <TaskCommentThread
                count={comment.replies.length}
              >
                {comment.replies.map((reply) => (
                  <TaskCommentItem
                    key={reply._id}
                    comment={{ ...reply, replies: [] }}
                    projectId={projectId}
                    taskId={taskId}
                    isReply
                  />
                ))}
              </TaskCommentThread>
            </div>
          )}
        </div>
      </div>

      <FilePreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPreviewStorageId(null)
          }
        }}
        file={previewAttachment}
      />
    </div>
  )
}
