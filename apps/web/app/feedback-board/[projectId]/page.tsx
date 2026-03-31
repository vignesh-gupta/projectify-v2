"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Globe2 } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { FeedbackBoard } from "@/app/project/[id]/feedbacks/components/feedback-board"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const STORAGE_KEY_PREFIX = "projectify-feedback-anon:"

function getAnonymousId(projectId: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${STORAGE_KEY_PREFIX}${projectId}:${crypto.randomUUID()}`
  }

  return `${STORAGE_KEY_PREFIX}${projectId}:${Math.random().toString(36).slice(2)}`
}

export default function PublicFeedbackBoardPage() {
  const params = useParams()
  const projectId = params.projectId as Id<"projects">
  const [anonymousId, setAnonymousId] = useState("")

  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${projectId}`
    const existingId = window.localStorage.getItem(storageKey)

    if (existingId) {
      setAnonymousId(existingId)
      return
    }

    const nextId = getAnonymousId(projectId)
    window.localStorage.setItem(storageKey, nextId)
    setAnonymousId(nextId)
  }, [projectId])

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm font-medium">
            <Globe2 className="size-4" />
            Public feedback board
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Help shape what gets built next
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Review published ideas, vote on the ones that matter most, and
              track what the team plans to do next.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How this board works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Use votes to signal priority. The board sorts best when
              high-signal ideas rise to the top.
            </p>
            <p>
              Public submissions are not enabled in this pass yet, so this page
              is currently view-and-vote.
            </p>
          </CardContent>
        </Card>

        <FeedbackBoard
          projectId={projectId}
          isPrivileged={false}
          publicMode
          anonymousId={anonymousId}
        />
      </div>
    </main>
  )
}
