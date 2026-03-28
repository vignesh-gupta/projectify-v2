"use client"

import { useRef, useEffect } from "react"
import { type Id } from "@/convex/_generated/dataModel"
import { MessageItem } from "./message-item"

export interface Message {
  _id: Id<"messages">
  projectId: Id<"projects">
  authorId: Id<"users">
  content: string
  threadId?: Id<"messages">
  attachments?: Id<"_storage">[]
  reactions?: Array<{ emoji: string; userId: Id<"users"> }>
  createdAt: number
  updatedAt?: number
  deletedAt?: number
  author: {
    _id: Id<"users">
    name?: string | null
    email?: string
    image?: string
  } | null
}

interface MessageListProps {
  messages: Message[]
  projectId: Id<"projects">
}

export function MessageList({ messages, projectId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6 space-y-4"
    >
      {messages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          projectId={projectId}
        />
      ))}
    </div>
  )
}
