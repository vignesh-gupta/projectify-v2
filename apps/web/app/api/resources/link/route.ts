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
      name?: string
      url?: string
      favicon?: string
      folderId?: string
    }

    if (!body.projectId || !body.name || !body.url) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "projectId, name and url are required",
        },
        { status: 400 }
      )
    }

    const client = getConvexClient()
    const result = await client.mutation(api.resources.createLinkByApiKey, {
      apiKey,
      projectId: body.projectId as Id<"projects">,
      name: body.name,
      url: body.url,
      favicon: body.favicon,
      folderId: body.folderId ? (body.folderId as Id<"folders">) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
