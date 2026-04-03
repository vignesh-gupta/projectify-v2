"use client"

import { api } from "@/convex/_generated/api"
import { type Id } from "@/convex/_generated/dataModel"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"
import { MessageSquareText } from "lucide-react"
import { TaskCommentInput } from "./task-comment-input"
import { TaskCommentItem } from "./task-comment-item"

interface TaskCommentsSectionProps {
  projectId: Id<"projects">
  taskId: Id<"tasks">
}

export function TaskCommentsSection({
  projectId,
  taskId,
}: TaskCommentsSectionProps) {
  const comments = useQuery(api.taskComments.listByTask, { taskId })

  if (comments === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TaskCommentInput projectId={projectId} taskId={taskId} />

      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
          <MessageSquareText className="mb-3 size-10 text-muted-foreground" />
          <h3 className="text-sm font-medium">No comments yet</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Start the discussion here for decisions, blockers, or quick follow-ups on this task.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <TaskCommentItem
              key={comment._id}
              comment={comment}
              projectId={projectId}
              taskId={taskId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
