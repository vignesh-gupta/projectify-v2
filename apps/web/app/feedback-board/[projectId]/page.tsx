"use client"

import { useState } from "react"
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
import { Badge } from "@workspace/ui/components/badge"

const STORAGE_KEY_PREFIX = "projectify-feedback-anon:"

function getAnonymousId(projectId: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${STORAGE_KEY_PREFIX}${projectId}:${crypto.randomUUID()}`
  }

  return `${STORAGE_KEY_PREFIX}${projectId}:${Math.random().toString(36).slice(2)}`
}

function getOrCreateAnonymousId(projectId: string): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return ""
  }

  const storageKey = `${STORAGE_KEY_PREFIX}${projectId}`
  const existingId = window.localStorage.getItem(storageKey)

  if (existingId) {
    return existingId
  }

  const nextId = getAnonymousId(projectId)
  window.localStorage.setItem(storageKey, nextId)
  return nextId
}

export default function PublicFeedbackBoardPage() {
  const params = useParams()
  const projectId = params.projectId as Id<"projects">
  const [anonymousId] = useState<string>(() =>
    getOrCreateAnonymousId(projectId)
  )

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="space-y-3">
          <Badge variant="outline" className="px-4 py-1.5 gap-1 text-sm">
            <Globe2 className="size-4" />
            Public feedback board
          </Badge>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Help shape what gets built next
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
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
