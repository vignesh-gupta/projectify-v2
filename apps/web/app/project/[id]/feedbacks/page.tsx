"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { Globe2 } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CreateFeedbackDialog } from "./components/create-feedback-dialog"
import { FeedbackBoard } from "./components/feedback-board"

export default function FeedbacksPage() {
  const params = useParams()
  const projectId = params.id as Id<"projects">
  const project = useQuery(api.projects.getProject, { projectId })
  const isPrivileged = project?.role === "owner" || project?.role === "admin"

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Feedbacks</h1>
          <p className="text-muted-foreground">
            Collect product feedback, prioritize by votes, and convert
            high-impact ideas to tasks.
          </p>
        </div>
        <CreateFeedbackDialog projectId={projectId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe2 className="size-4" />
            Public sharing and integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Public board: <code>/feedback-board/{projectId}</code>
          </p>
          <p>
            Public voting is available now. External submission and embed/API
            endpoints are next.
          </p>
        </CardContent>
      </Card>

      <FeedbackBoard
        projectId={projectId}
        isPrivileged={Boolean(isPrivileged)}
      />
    </div>
  )
}
