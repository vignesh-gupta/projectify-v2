"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { BookOpen, Globe2 } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { CreateFeedbackDialog } from "./components/create-feedback-dialog"
import { FeedbackBoard } from "./components/feedback-board"
import Link from "next/link"

export default function FeedbacksPage() {
  const params = useParams()
  const projectId = params.id as Id<"projects">
  const project = useQuery(api.projects.getProject, { projectId })
  const isPrivileged = project?.role === "owner" || project?.role === "admin"
  const [docsOpen, setDocsOpen] = useState(false)

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
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe2 className="size-4" />
              Public sharing and integration
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDocsOpen(true)}
            >
              <BookOpen className="mr-2 size-4" />
              Integration docs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Public board:{" "}
            <Link href={`/feedback-board/${projectId}`}>
              <code>/feedback-board/{projectId}</code>
            </Link>
          </p>
          <p>
            Public voting and anonymous submission are now available. External
            API endpoints are also available for submitting feedback from other
            apps and automating idea collection. See the docs for details.
          </p>
        </CardContent>
      </Card>

      <FeedbackBoard
        projectId={projectId}
        isPrivileged={Boolean(isPrivileged)}
      />

      <Sheet open={docsOpen} onOpenChange={setDocsOpen}>
        <SheetContent className="sm:max-w-2xl!">
          <SheetHeader>
            <SheetTitle>Feedback integration docs</SheetTitle>
            <SheetDescription>
              Use the public board for human submissions and the API for simple
              external integrations.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 pb-6 text-sm">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Public board</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-muted-foreground">
                <p>
                  Share this URL with external users to let them submit and vote
                  on public feedback.
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {`/feedback-board/${projectId}`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">HTTP API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p>
                  Submit public feedback from another app or form by posting
                  JSON to the project endpoint.
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {`POST /api/feedback/${projectId}
Content-Type: application/json

{
  "title": "String",
  "description": "String",
  "category": "feature" | "improvement" | "bug",
  "submitterName": "Optional string",
  "submitterEmail": "Optional string",
  "anonymousId": "Optional string for tracking unique users without info"
}`}
                </pre>
                <p>
                  The endpoint returns a success flag, message, and the created
                  feedback id. A lightweight docs endpoint is also available at{" "}
                  <code>/api/feedback-integrations</code>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversion behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-muted-foreground">
                <p>
                  Converting feedback to a task now stores a persistent task
                  link on the feedback item.
                </p>
                <p>
                  If someone tries to convert the same feedback again,
                  Projectify reuses the existing linked task instead of creating
                  a duplicate.
                </p>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
