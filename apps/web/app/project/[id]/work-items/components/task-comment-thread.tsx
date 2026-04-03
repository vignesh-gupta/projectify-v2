"use client"

import { Button } from "@workspace/ui/components/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { type ReactNode } from "react"
import { useState } from "react"

interface TaskCommentThreadProps {
  count: number
  children: ReactNode
}

export function TaskCommentThread({ count, children }: TaskCommentThreadProps) {
  const [expanded, setExpanded] = useState(true)

  if (!count) return null

  return (
    <div className="ml-6 space-y-3 border-l pl-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-auto px-0 text-xs text-muted-foreground"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <ChevronUp className="mr-1 size-4" />
        ) : (
          <ChevronDown className="mr-1 size-4" />
        )}
        {expanded ? "Hide" : "Show"} {count} repl{count === 1 ? "y" : "ies"}
      </Button>

      {expanded && <div className="space-y-3">{children}</div>}
    </div>
  )
}
