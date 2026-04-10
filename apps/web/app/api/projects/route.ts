import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
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
    const statusParam = searchParams.get("status")
    const status =
      statusParam === "development" ||
      statusParam === "maintenance" ||
      statusParam === "inactive"
        ? statusParam
        : undefined
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const client = getConvexClient()
    const result = await client.query(api.projects.listByApiKey, {
      apiKey,
      status,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
    })

    return NextResponse.json({
      projects: result.projects.map((project) => ({
        ...project,
        dueDate: toIsoDate(project.dueDate),
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
      title?: string
      description?: string
      status?: "development" | "maintenance" | "inactive"
      dueDate?: string
      icon?: string
    }

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Bad Request", message: "title is required" },
        { status: 400 }
      )
    }

    const client = getConvexClient()
    const result = await client.mutation(api.projects.createByApiKey, {
      apiKey,
      title: body.title.trim(),
      description: body.description,
      status: body.status,
      dueDate: toTimestamp(body.dueDate),
      icon: body.icon,
    })

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
