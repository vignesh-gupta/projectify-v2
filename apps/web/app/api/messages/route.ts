import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { getConvexClient } from "@/convex/lib/client"
import { NextRequest, NextResponse } from "next/server"

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7).trim()
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
  if (lower.includes("required") || lower.includes("invalid")) {
    return NextResponse.json({ error: "Bad Request", message }, { status: 400 })
  }
  return NextResponse.json(
    { error: "Internal Server Error", message },
    { status: 500 }
  )
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

    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const client = getConvexClient()
    const result = await client.query(api.messages.listByApiKey, {
      apiKey,
      projectId: projectId as Id<"projects">,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
    })

    return NextResponse.json(result)
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
      content?: string
      threadId?: string
    }

    if (!body.projectId || !body.content?.trim()) {
      return NextResponse.json(
        { error: "Bad Request", message: "projectId and content are required" },
        { status: 400 }
      )
    }

    const client = getConvexClient()
    const result = await client.mutation(api.messages.sendByApiKey, {
      apiKey,
      projectId: body.projectId as Id<"projects">,
      content: body.content.trim(),
      threadId: body.threadId ? (body.threadId as Id<"messages">) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
