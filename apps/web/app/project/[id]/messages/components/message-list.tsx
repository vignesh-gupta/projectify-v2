"use client"

import { type Id } from "@/convex/_generated/dataModel"
import { useScroll } from "@/hook/use-scroll"
import { Button } from "@workspace/ui/components/button"
import { useRef } from "react"
import { MessageItem } from "./message-item"

export interface Message {
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

interface MessageListProps {
  messages: Message[]
  projectId: Id<"projects">
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted"
  isLoading: boolean
  loadMore: (numItems: number) => void
}

interface MessageRowProps {
  message: Message
  projectId: Id<"projects">
}

function MessageRow({ message, projectId }: MessageRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  if (!message) {
    return null
  }

  return (
    <div ref={rowRef} className="px-6 py-2" id={`message-${message._id}`}>
      <MessageItem message={message} projectId={projectId} />
    </div>
  )
}

export function MessageList({
  messages,
  projectId,
  status,
  loadMore,
  isLoading,
}: MessageListProps) {
  // Always scroll to the bottom when new messages arrive
  const scrollRef = useScroll("smooth", "end", [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No messages yet
          </p>
          <p className="text-sm text-muted-foreground">
            Be the first to send a message
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100dvh-250px)] flex-1 space-y-4 overflow-y-auto p-6">
      <div className="flex min-h-full flex-col-reverse" ref={scrollRef}>
        {messages.map((message) => (
          <MessageRow
            key={message._id}
            message={message}
            projectId={projectId}
          />
        ))}

        {!isLoading && status == "CanLoadMore" && (
          <div className="flex items-center justify-center gap-x-2 p-2">
            <Button variant="ghost" onClick={loadMore.bind(null, 10)}>
              Load More
            </Button>
          </div>
        )}

        {!isLoading && status == "Exhausted" && messages.length != 0 && (
          <div className="flex items-center justify-center gap-x-2 p-2 text-muted-foreground">
            <p>No more messages</p>
          </div>
        )}
      </div>
    </div>
  )
}
