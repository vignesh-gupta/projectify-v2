import { NextRequest, NextResponse } from "next/server"
import type { Id } from "@/convex/_generated/dataModel"
import { getPublishedChangelogEntry } from "@/lib/changelog-api"
import { renderChangelogContent } from "@/lib/changelog-presenter"
import {
  authenticateRequest,
  createUnauthorizedResponse,
  createErrorResponse,
} from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; changelogId: string }> }
) {
  try {
    const { projectId, changelogId } = await context.params

    // Authenticate with user API key (requires changelog:read scope)
    const auth = await authenticateRequest(request, ["changelog:read"])
    if (!auth.authenticated) {
      return createUnauthorizedResponse(auth.error)
    }

    const data = await getPublishedChangelogEntry(
      projectId as Id<"projects">,
      changelogId as Id<"changelog">
    )

    return NextResponse.json({
      success: true,
      project: data.project,
      entry: {
        ...data.entry,
        contentHtml: renderChangelogContent(data.entry.content),
      },
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch changelog entry."

    return createErrorResponse(message, 500)
  }
}
