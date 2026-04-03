"use client"

import { useEffect } from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { MessageList } from "./components/message-list"
import { MessageInput } from "./components/message-input"
import { MessageSearch } from "./components/message-search"
import { TypingIndicator } from "./components/typing-indicator"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

export default function MessagesPage() {
  const { id } = useParams<{ id: Id<"projects"> }>()

  const {
    results: messages,
    status,
    isLoading,
    loadMore,
  } = usePaginatedQuery(
    api.messages.list,
    { projectId: id },
    { initialNumItems: 10 }
  )
  const markAsRead = useMutation(api.messages.markAsRead)

  // Mark messages as read when page loads or new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead({ projectId: id }).catch((error) => {
        console.error("Failed to mark messages as read:", error)
      })
    }
  }, [messages, id, markAsRead])

  if (status === "LoadingFirstPage" && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-20 shrink-0 border-b bg-background/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Chat with your team members
            </p>
          </div>
          <MessageSearch projectId={id} />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <MessageList
          messages={messages}
          projectId={id}
          status={status}
          isLoading={isLoading}
          loadMore={loadMore}
        />
      </div>

      <div className="z-20 shrink-0 bg-background/95 backdrop-blur">
        <TypingIndicator projectId={id} />
        <MessageInput projectId={id} />
      </div>
    </div>
  )
}
