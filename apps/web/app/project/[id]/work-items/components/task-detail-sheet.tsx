"use client"

import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { useMutation, useQuery } from "convex/react"
import { Calendar, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { RichTextEditor } from "@/components/rich-text-editor"
import { AssigneeSelector } from "@/components/assignee-selector"

type Task = Doc<"tasks">

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assigneeUserId: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

interface TaskDetailSheetProps {
  task: Task
  projectId: Id<"projects">
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditableChange: (isEditable: boolean) => void
  isEditable: boolean
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  isEditable,
  onEditableChange,
  projectId,
}: TaskDetailSheetProps) {
  const updateTask = useMutation(api.tasks.update)

  // Query assignee details
  const members = useQuery(api.mentions.getProjectMembers, { projectId })
  const assigneeUser = members?.find((m) => m._id === task.assigneeUserId)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    values: {
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      assigneeUserId: task.assigneeUserId || undefined,
    },
  })

  const onSubmit = async (values: TaskFormValues) => {
    try {
      const updateData: {
        taskId: Id<"tasks">
        title: string
        description?: string
        status: "todo" | "in_progress" | "done"
        priority: "low" | "medium" | "high"
        dueDate?: number
        assigneeUserId?: Id<"users">
        clearAssignee?: boolean
      } = {
        taskId: task._id,
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate
          ? new Date(values.dueDate).getTime()
          : undefined,
      }

      // Handle assignee update/removal
      if (values.assigneeUserId) {
        updateData.assigneeUserId = values.assigneeUserId as Id<"users">
      } else if (task.assigneeUserId) {
        // Clear assignee if it was set before
        updateData.clearAssignee = true
      }

      await updateTask(updateData)
      toast.success("Task updated successfully")
      form.reset(values)
      onEditableChange(false)
    } catch (error) {
      toast.error("Failed to update task")
      console.error(error)
    }
  }

  const handleCancel = () => {
    form.reset()
    onEditableChange(false)
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
      <SheetContent className="sm:min-w-2xl">
        <SheetHeader>
          <SheetTitle>Task Details</SheetTitle>
          <SheetDescription>View and edit task information</SheetDescription>
        </SheetHeader>

        <div className="mx-4 mt-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    {isEditable ? (
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                    ) : (
                      <p className="text-sm">{task.title}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter task description"
                        editable={isEditable}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      {isEditable ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm capitalize">
                          {task.status.replace("_", " ")}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      {isEditable ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm capitalize">{task.priority}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    {isEditable ? (
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    ) : task.dueDate ? (
                      <p className="flex items-center gap-2 text-sm">
                        <Calendar className="size-4" />
                        {formatDate(task.dueDate)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No due date set
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigneeUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    {isEditable ? (
                      <FormControl>
                        <AssigneeSelector
                          projectId={projectId}
                          value={field.value as Id<"users"> | undefined}
                          onChange={field.onChange}
                          placeholder="Assign to someone"
                        />
                      </FormControl>
                    ) : assigneeUser ? (
                      <div className="flex items-center gap-2 text-sm">
                        {assigneeUser.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={assigneeUser.image}
                            alt={assigneeUser.name || "User"}
                            className="size-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-6 items-center justify-center rounded-full bg-muted">
                            <User className="size-3" />
                          </div>
                        )}
                        <span>{assigneeUser.name || assigneeUser.email}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not assigned
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditable && (
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </Form>

          {!isEditable && (
            <div className="flex gap-2 pt-4">
              <Button onClick={() => onEditableChange(true)} className="flex-1">
                Edit Task
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
