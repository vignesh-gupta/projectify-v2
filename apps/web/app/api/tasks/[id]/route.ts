import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured")
  }
  return new ConvexHttpClient(convexUrl)
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7).trim()
}

function toTimestamp(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? undefined : parsed
}

function toIsoDate(value?: number): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed"
  const lower = message.toLowerCase()

  if (
    lower.includes("invalid api key") ||
    lower.includes("expired") ||
    lower.includes("revoked")
  ) {
    return NextResponse.json(
      { error: "Unauthorized", message },
      { status: 401 }
    )
  }
  if (
    lower.includes("forbidden") ||
    lower.includes("permission") ||
    lower.includes("scope")
  ) {
    return NextResponse.json({ error: "Forbidden", message }, { status: 403 })
  }
  if (lower.includes("not found")) {
    return NextResponse.json({ error: "Not Found", message }, { status: 404 })
  }
  return NextResponse.json(
    { error: "Internal Server Error", message },
    { status: 500 }
  )
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = getBearerToken(request)
    if (!apiKey) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const client = getConvexClient()
    const result = await client.query(api.tasks.getByApiKey, {
      apiKey,
      taskId: id as Id<"tasks">,
    })

    return NextResponse.json({
      task: {
        ...result.task,
        dueDate: toIsoDate(result.task.dueDate),
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = getBearerToken(request)
    if (!apiKey) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = (await request.json()) as {
      title?: string
      description?: string
      status?: "todo" | "in_progress" | "done"
      priority?: "low" | "medium" | "high"
      dueDate?: string
      assigneeUserId?: string
    }

    const client = getConvexClient()
    const result = await client.mutation(api.tasks.updateByApiKey, {
      apiKey,
      taskId: id as Id<"tasks">,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      dueDate: toTimestamp(body.dueDate),
      assigneeUserId: body.assigneeUserId
        ? (body.assigneeUserId as Id<"users">)
        : undefined,
    })

    return NextResponse.json({
      task: {
        ...result.task,
        dueDate: toIsoDate(result.task.dueDate),
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = getBearerToken(request)
    if (!apiKey) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const client = getConvexClient()
    const result = await client.mutation(api.tasks.deleteByApiKey, {
      apiKey,
      taskId: id as Id<"tasks">,
    })

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
