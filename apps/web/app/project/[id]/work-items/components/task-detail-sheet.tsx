"use client"

import { useMutation } from "convex/react"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Calendar } from "lucide-react"
import { toast } from "sonner"

type Task = Doc<"tasks">

interface TaskDetailSheetProps {
  task: Task
  projectId: Id<"projects">
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  )

  const updateTask = useMutation(api.tasks.update)

  const handleSave = async () => {
    try {
      await updateTask({
        taskId: task._id,
        title: title || task.title,
        description: description || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      })
      toast.success("Task updated successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update task")
      console.error(error)
    }
  }

  const handleCancel = () => {
    setTitle(task.title)
    setDescription(task.description || "")
    setStatus(task.status)
    setPriority(task.priority)
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
    setIsEditing(false)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Task Details</SheetTitle>
          <SheetDescription>View and edit task information</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            {isEditing ? (
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
              />
            ) : (
              <p className="text-sm">{task.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{task.description || "No description"}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              {isEditing ? (
                <Select value={status} onValueChange={(value: typeof status) => setStatus(value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm capitalize">{task.status.replace("_", " ")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              {isEditing ? (
                <Select value={priority} onValueChange={(value: typeof priority) => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm capitalize">{task.priority}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            {isEditing ? (
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            ) : task.dueDate ? (
              <p className="flex items-center gap-2 text-sm">
                <Calendar className="size-4" />
                {formatDate(task.dueDate)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No due date set</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="flex-1">
                Edit Task
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
