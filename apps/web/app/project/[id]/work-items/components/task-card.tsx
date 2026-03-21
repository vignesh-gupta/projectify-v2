"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, MoreHorizontal, User } from "lucide-react"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"
import { TaskDetailSheet } from "./task-detail-sheet"
import { DeleteTaskDialog } from "./delete-task-dialog"

type Task = Doc<"tasks">

interface TaskCardProps {
  task: Task
  projectId: Id<"projects">
  isDragging?: boolean
}

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
}

export function TaskCard({ task, projectId, isDragging = false }: TaskCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: task._id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md",
          isDragging && "shadow-lg opacity-50"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", priorityColors[task.priority])} />
                <h3
                  className="cursor-pointer text-sm font-medium leading-tight hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDetail(true)
                  }}
                >
                  {task.title}
                </h3>
              </div>

              {task.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                )}
                {task.assigneeUserId && (
                  <div className="flex items-center gap-1">
                    <User className="size-3" />
                    <span>Assigned</span>
                  </div>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetail(true)}>View details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDetail(true)}>Edit task</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <TaskDetailSheet
        task={task}
        projectId={projectId}
        open={showDetail}
        onOpenChange={setShowDetail}
      />

      <DeleteTaskDialog
        taskId={task._id}
        taskTitle={task.title}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  )
}
