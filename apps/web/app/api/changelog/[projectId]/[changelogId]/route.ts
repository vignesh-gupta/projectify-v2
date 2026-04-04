import { NextRequest, NextResponse } from "next/server"
import type { Id } from "@/convex/_generated/dataModel"
import {
  authenticateChangelogApiKey,
  getPublishedChangelogEntry,
} from "@/lib/changelog-api"

function extractApiKey(request: NextRequest) {
  const bearer = request.headers.get("authorization")
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim()
  }

  return request.headers.get("x-api-key")?.trim() ?? ""
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; changelogId: string }> }
) {
  try {
    const { projectId, changelogId } = await context.params
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

    const data = await getPublishedChangelogEntry(
      projectId as Id<"projects">,
      changelogId as Id<"changelog">
    )

    return NextResponse.json({
      success: true,
      project: data.project,
      entry: data.entry,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch changelog entry."

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
