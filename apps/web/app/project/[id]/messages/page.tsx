"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { MessageList } from "./components/message-list"
import { MessageInput } from "./components/message-input"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

export default function MessagesPage() {
  const { id } = useParams<{ id: Id<"projects"> }>()

  const messages = useQuery(api.messages.list, { projectId: id })

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
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with your team members
        </p>
      </div>

      <MessageList messages={messages} projectId={id} />

      <MessageInput projectId={id} />
    </div>
  )
}
