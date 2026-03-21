"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar, MoreHorizontal } from "lucide-react"
import { Doc, Id } from "@/convex/_generated/dataModel"
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

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
}

const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
}

export function TaskActionsCell({ task, projectId }: { task: Task; projectId: Id<"projects"> }) {
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
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

export const createTaskColumns = (projectId: Id<"projects">): ColumnDef<Task>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const task = row.original
      return (
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full flex-shrink-0", priorityColors[task.priority])} />
          <span className="font-medium">{task.title}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusLabels
      return <span className="capitalize">{statusLabels[status]}</span>
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const priority = row.getValue("priority") as keyof typeof priorityColors
      return <span className="capitalize">{priority}</span>
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as number | undefined
      if (!dueDate) return <span className="text-muted-foreground">No due date</span>
      
      const date = new Date(dueDate)
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const task = row.original
      return <TaskActionsCell task={task} projectId={projectId} />
    },
  },
]
