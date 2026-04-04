import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { z } from "zod"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

const payloadSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  category: z.enum(["bug", "feature", "improvement"]),
  submitterName: z.string().max(100).optional(),
  submitterEmail: z.string().email().optional(),
  anonymousId: z.string().min(1).optional(),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const body = payloadSchema.parse(await request.json())

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json(
        { success: false, message: "Convex URL is not configured." },
        { status: 500 }
      )
    }

    const client = new ConvexHttpClient(convexUrl)
    const forwardedFor = request.headers.get("x-forwarded-for")
    const fallbackAnonymousId = forwardedFor
      ? `api:${forwardedFor.split(",")[0]?.trim()}`
      : "api:anonymous"

    const feedbackId = await client.mutation(api.feedback.createPublic, {
      projectId: projectId as Id<"projects">,
      title: body.title,
      description: body.description,
      category: body.category,
      submitterName: body.submitterName,
      submitterEmail: body.submitterEmail,
      anonymousId: body.anonymousId ?? fallbackAnonymousId,
    })

    return NextResponse.json({
      success: true,
      feedbackId,
      message: "Feedback submitted successfully.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request payload.",
          issues: error.flatten(),
        },
        { status: 400 }
      )
    }

    const message =
      error instanceof Error ? error.message : "Failed to submit feedback."

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
