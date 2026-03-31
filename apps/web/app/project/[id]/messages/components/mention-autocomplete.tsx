"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { cn } from "@workspace/ui/lib/utils"

interface MentionUser {
  _id: Id<"users">
  name: string | null
  email: string
  image?: string
}

interface MentionAutocompleteProps {
  projectId: Id<"projects">
  searchQuery: string
  onSelect: (user: MentionUser) => void
  position: { top: number; left: number }
}

export function MentionAutocomplete({
  projectId,
  searchQuery,
  onSelect,
  position,
}: MentionAutocompleteProps) {
  const members = useQuery(api.mentions.getProjectMembers, {
    projectId,
    searchQuery,
  })

  if (!members || members.length === 0) {
    return null
  }

  return (
    <div
      className="absolute z-50 w-64 rounded-md border bg-popover shadow-md"
      style={{
        bottom: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="max-h-60 overflow-y-auto p-1">
        {members.map((member, index) => (
          <button
            key={member._id}
            onClick={() => onSelect(member as MentionUser)}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent",
              index === 0 && "bg-accent"
            )}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={member.image} />
              <AvatarFallback className="text-xs">
                {member.name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">{member.name || "Unknown"}</span>
              <span className="text-xs text-muted-foreground">{member.email}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
