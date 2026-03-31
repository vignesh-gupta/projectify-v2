"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { useState, useRef, useEffect } from "react"

interface MentionProps {
  mention: string
  projectId: Id<"projects">
  className?: string
}

export function Mention({ mention, projectId, className }: MentionProps) {
  const [showCard, setShowCard] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  
  // Extract the name from @mention
  const mentionName = mention.replace("@", "").trim()
  
  // Get all project members to find the mentioned user
  const members = useQuery(api.mentions.getProjectMembers, {
    projectId,
    searchQuery: mentionName,
  })

  const user = members?.[0]

  useEffect(() => {
    if (showCard && spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect()
      const cardWidth = 320 // w-80 = 320px
      const cardHeight = 100 // approximate height
      
      // Calculate position to keep card in viewport
      let top = rect.top - cardHeight - 8 // Default: above
      let left = rect.left
      
      // If card would go off top, show below instead
      if (top < 10) {
        top = rect.bottom + 8
      }
      
      // If card would go off right, align to right edge
      if (left + cardWidth > window.innerWidth - 10) {
        left = window.innerWidth - cardWidth - 10
      }
      
      // If card would go off left, align to left edge
      if (left < 10) {
        left = 10
      }
      
      setPosition({ top, left })
    }
  }, [showCard])

  if (!user) {
    return <span className={className}>{mention}</span>
  }

  return (
    <>
      <span 
        ref={spanRef}
        className={className}
        onMouseEnter={() => setShowCard(true)}
        onMouseLeave={() => setShowCard(false)}
      >
        {mention}
      </span>
      {showCard && position && (
        <div 
          className="fixed z-50 w-80 rounded-md border bg-popover p-4 shadow-lg"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onMouseEnter={() => setShowCard(true)}
          onMouseLeave={() => setShowCard(false)}
        >
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={user.image} />
              <AvatarFallback>
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{user.name || "Unknown User"}</h4>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
