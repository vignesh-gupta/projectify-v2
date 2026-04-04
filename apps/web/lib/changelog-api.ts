import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

function getConvexUrl() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured")
  }
  return convexUrl
}

export function getConvexHttpClient() {
  return new ConvexHttpClient(getConvexUrl())
}

export async function getPublishedChangelog(projectId: Id<"projects">) {
  const client = getConvexHttpClient()
  return await client.query(api.changelog.listPublishedByProject, { projectId })
}

export async function getPublishedChangelogEntry(
  projectId: Id<"projects">,
  changelogId: Id<"changelog">
) {
  const client = getConvexHttpClient()
  return await client.query(api.changelog.getPublishedEntry, {
    projectId,
    changelogId,
  })
}

export async function authenticateChangelogApiKey(
  projectId: Id<"projects">,
  apiKey: string
) {
  const client = getConvexHttpClient()
  return await client.action(api.changelog.authenticateApiKey, {
    projectId,
    apiKey,
  })
}
