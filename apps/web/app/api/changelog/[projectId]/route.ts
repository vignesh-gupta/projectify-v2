import { NextRequest, NextResponse } from "next/server"
import type { Id } from "@/convex/_generated/dataModel"
import { getPublishedChangelog } from "@/lib/changelog-api"
import { renderChangelogContent } from "@/lib/changelog-presenter"
import {
  authenticateRequest,
  createUnauthorizedResponse,
  createErrorResponse,
} from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params

    // Authenticate with user API key (requires changelog:read scope)
    const auth = await authenticateRequest(request, ["changelog:read"])
    if (!auth.authenticated) {
      return createUnauthorizedResponse(auth.error)
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

    return createErrorResponse(message, 500)
  }
}
