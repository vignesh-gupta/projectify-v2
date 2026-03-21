"use client"

import { useDroppable } from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { ReactNode } from "react"

interface KanbanColumnProps {
  id: string
  title: string
  count: number
  children: ReactNode
}

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <Card className={isOver ? "border-primary ring-2 ring-primary ring-opacity-50" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>{title}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {count}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="min-h-100">
        {children}
      </CardContent>
    </Card>
  )
}
