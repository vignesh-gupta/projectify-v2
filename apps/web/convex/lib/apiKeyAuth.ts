import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

type ApiKeyAuth = {
  userId: Id<"users">
  scopes: string[]
}

const textEncoder = new TextEncoder()

async function hashApiKey(apiKey: string): Promise<string> {
  const data = textEncoder.encode(apiKey)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export async function authenticateApiKey(
  ctx: QueryCtx | MutationCtx,
  rawApiKey: string
): Promise<ApiKeyAuth> {
  const apiKey = rawApiKey.trim()
  if (!apiKey || !apiKey.startsWith("uk_")) {
    throw new Error("Invalid API key")
  }

  const keyHash = await hashApiKey(apiKey)
  const keys = await ctx.db.query("userApiKeys").collect()
  const key = keys.find((item: Doc<"userApiKeys">) => item.keyHash === keyHash)

  if (!key) {
    throw new Error("Invalid API key")
  }

  if (key.status === "revoked") {
    throw new Error("API key has been revoked")
  }

  if (key.expiresAt && key.expiresAt <= Date.now()) {
    throw new Error("API key has expired")
  }

  return {
    userId: key.userId,
    scopes: key.scopes,
  }
}

export function requireScope(scopes: string[], required: string): void {
  if (!scopes.includes(required)) {
    throw new Error("Forbidden: missing required scope")
  }
}

export async function requireProjectMembership(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
) {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId)
    )
    .first()

  if (!membership) {
    throw new Error("Forbidden: you do not have access to this project")
  }

  return membership
}
