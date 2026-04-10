import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import type { Id } from "@/convex/_generated/dataModel"

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

  if (lower.includes("invalid api key") || lower.includes("expired") || lower.includes("revoked")) {
    return NextResponse.json({ error: "Unauthorized", message }, { status: 401 })
  }
  if (lower.includes("forbidden") || lower.includes("permission") || lower.includes("scope")) {
    return NextResponse.json({ error: "Forbidden", message }, { status: 403 })
  }
  if (lower.includes("not found")) {
    return NextResponse.json({ error: "Not Found", message }, { status: 404 })
  }
  return NextResponse.json({ error: "Internal Server Error", message }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = getBearerToken(request)
    if (!apiKey) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get("projectId")
    if (!projectId) {
      return NextResponse.json(
        { error: "Bad Request", message: "projectId is required" },
        { status: 400 }
      )
    }

    const status = searchParams.get("status") ?? undefined
    const priority = searchParams.get("priority") ?? undefined
    const assigneeId = searchParams.get("assigneeId") ?? undefined
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const client = getConvexClient()
    const result = (await client.query("cliApi:listTasks" as never, {
      apiKey,
      projectId: projectId as Id<"projects">,
      status,
      priority,
      assigneeUserId: assigneeId ? (assigneeId as Id<"users">) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
    } as never)) as unknown as {
      tasks: Array<{ dueDate?: number; [key: string]: unknown }>
      total: number
    }

    return NextResponse.json({
      tasks: result.tasks.map((task: { dueDate?: number; [key: string]: unknown }) => ({
        ...task,
        dueDate: toIsoDate(task.dueDate),
      })),
      total: result.total,
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getBearerToken(request)
    if (!apiKey) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        { status: 401 }
      )
    }

    const body = (await request.json()) as {
      projectId?: string
      title?: string
      description?: string
      status?: "todo" | "in_progress" | "done"
      priority?: "low" | "medium" | "high"
      dueDate?: string
      assigneeUserId?: string
    }

    if (!body.projectId || !body.title?.trim()) {
      return NextResponse.json(
        { error: "Bad Request", message: "projectId and title are required" },
        { status: 400 }
      )
    }

    const client = getConvexClient()
    const result = (await client.mutation("cliApi:createTask" as never, {
      apiKey,
      projectId: body.projectId as Id<"projects">,
      title: body.title.trim(),
      description: body.description,
      status: body.status,
      priority: body.priority,
      dueDate: toTimestamp(body.dueDate),
      assigneeUserId: body.assigneeUserId
        ? (body.assigneeUserId as Id<"users">)
        : undefined,
    } as never)) as unknown as {
      task: { dueDate?: number; [key: string]: unknown }
    }

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
