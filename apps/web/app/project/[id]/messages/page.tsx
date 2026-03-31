"use client"

import { useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
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

  const messages = useQuery(api.messages.list, { projectId: id })
  const markAsRead = useMutation(api.messages.markAsRead)

  // Mark messages as read when page loads or new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      markAsRead({ projectId: id }).catch((error) => {
        console.error("Failed to mark messages as read:", error)
      })
    }
  }, [messages, id, markAsRead])

  if (messages === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
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

      <MessageList messages={messages} projectId={id} />

      <TypingIndicator projectId={id} />

      <MessageInput projectId={id} />
    </div>
  )
}
