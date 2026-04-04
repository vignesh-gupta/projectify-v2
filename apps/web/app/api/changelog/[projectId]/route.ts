import { NextRequest, NextResponse } from "next/server"
import type { Id } from "@/convex/_generated/dataModel"
import {
  authenticateChangelogApiKey,
  getPublishedChangelog,
} from "@/lib/changelog-api"
import { renderChangelogContent } from "@/lib/changelog-presenter"

function extractApiKey(request: NextRequest) {
  const bearer = request.headers.get("authorization")
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim()
  }

  return request.headers.get("x-api-key")?.trim() ?? ""
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const apiKey = extractApiKey(request)
    const auth = await authenticateChangelogApiKey(
      projectId as Id<"projects">,
      apiKey
    )

    if (!auth || !auth.scopes.includes("read:changelog")) {
      return NextResponse.json(
        { success: false, message: "Invalid API key." },
        { status: 401 }
      )
    }

    const data = await getPublishedChangelog(projectId as Id<"projects">)
    return NextResponse.json({
      success: true,
      project: data.project,
      entries: data.entries.map((entry) => ({
        ...entry,
        contentHtml: renderChangelogContent(entry.content),
      })),
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch changelog entries."

    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
