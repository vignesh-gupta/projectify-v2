"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { MessageItem } from "./message-item"
import { MessageInput } from "./message-input"
import { Loader2 } from "lucide-react"

interface MessageThreadProps {
  threadId: Id<"messages">
  projectId: Id<"projects">
}

export function MessageThread({
  threadId,
  projectId,
}: MessageThreadProps) {
  const replies = useQuery(api.messages.getThread, { threadId })

  if (replies === undefined) {
    return (
      <div className="ml-12 mt-2 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading replies...</span>
      </div>
    )
  }

  return (
    <div className="ml-12 mt-4 space-y-4 border-l-2 pl-4">
      {replies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No replies yet</p>
      ) : (
        replies.map((reply) => (
          <MessageItem
            key={reply._id}
            message={reply}
            projectId={projectId}
            isReply
          />
        ))
      )}

      <MessageInput
        projectId={projectId}
        threadId={threadId}
        placeholder="Reply to this message..."
      />
    </div>
  )
}
