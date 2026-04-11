import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js"
import type { Id, TableNames } from "@/convex/_generated/dataModel"
import type { SystemTableNames } from "convex/server"
import type { getConvexClient } from "@/convex/lib/client"
import type { getPublishedChangelogEntry } from "@/lib/changelog-api"
import type { renderChangelogContent } from "@/lib/changelog-presenter"

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>
  isError?: true
}

export type ToolExtra = {
  authInfo?: AuthInfo
}

export type ToolDeps = {
  getConvexClient: typeof getConvexClient
  getPublishedChangelogEntry: typeof getPublishedChangelogEntry
  renderChangelogContent: typeof renderChangelogContent
}

const textJson = (title: string, data: unknown) =>
  `${title}\n\n${JSON.stringify(data, null, 2)}`

export function toIsoDate(value?: number): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

export function toTimestamp(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? undefined : parsed
}

export function readAuth(extra: ToolExtra, requiredScope?: string): string {
  const token = extra.authInfo?.token
  if (!token) {
    throw new Error("Unauthorized: missing API key token")
  }
  if (requiredScope && !extra.authInfo?.scopes?.includes(requiredScope)) {
    throw new Error(`Forbidden: missing required scope ${requiredScope}`)
  }
  return token
}

export async function runTool(
  name: string,
  run: () => Promise<unknown>
): Promise<ToolResult> {
  try {
    const data = await run()
    return {
      content: [{ type: "text", text: textJson(`${name} succeeded`, data) }],
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: textJson(`${name} failed`, {
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        },
      ],
    }
  }
}

export function asId<T extends TableNames | SystemTableNames>(
  value: string
): Id<T> {
  return value as Id<T>
}

