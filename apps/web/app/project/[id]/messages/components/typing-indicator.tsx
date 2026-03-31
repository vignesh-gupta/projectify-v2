"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"

interface TypingIndicatorProps {
  projectId: Id<"projects">
}

export function TypingIndicator({ projectId }: TypingIndicatorProps) {
  const typingUsers = useQuery(api.typing.getTypingUsers, { projectId })

  if (!typingUsers || typingUsers.length === 0) {
    return null
  }

  const names = typingUsers.map((u) => u.name || u.email).filter(Boolean)

  let text = ""
  if (names.length === 1) {
    text = `${names[0]} is typing...`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`
  } else if (names.length > 2) {
    text = `${names[0]}, ${names[1]}, and ${names.length - 2} ${names.length - 2 === 1 ? "other" : "others"} are typing...`
  }

  return (
    <div className="px-6 py-2 text-sm text-muted-foreground italic flex items-center gap-2">
      <div className="flex gap-1">
        <span className="animate-bounce inline-block" style={{ animationDelay: "0ms" }}>
          ●
        </span>
        <span className="animate-bounce inline-block" style={{ animationDelay: "150ms" }}>
          ●
        </span>
        <span className="animate-bounce inline-block" style={{ animationDelay: "300ms" }}>
          ●
        </span>
      </div>
      <span>{text}</span>
    </div>
  )
}
