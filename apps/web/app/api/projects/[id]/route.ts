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
    const result = (await client.query("cliApi:getProject" as never, {
      apiKey,
      projectId: id as Id<"projects">,
    } as never)) as unknown as {
      project: { dueDate?: number; [key: string]: unknown }
    }

    return NextResponse.json({
      project: {
        ...result.project,
        dueDate: toIsoDate(result.project.dueDate),
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
    const result = (await client.mutation("cliApi:deleteProject" as never, {
      apiKey,
      projectId: id as Id<"projects">,
    } as never)) as unknown as { success: boolean; message?: string }

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
