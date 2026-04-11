import { api } from "@/convex/_generated/api"
import { getConvexClient } from "@/convex/lib/client"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { apiKey?: string }
    const apiKey = body.apiKey?.trim()

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: "API key is required" },
        { status: 400 }
      )
    }

    const client = getConvexClient()
    const result = await client.query(api.userApiKeys.validateApiKey, {
      apiKey,
    })

    if (!result.valid) {
      return NextResponse.json(result, { status: 401 })
    }

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to validate API key"
    return NextResponse.json({ valid: false, error: message }, { status: 500 })
  }
}
