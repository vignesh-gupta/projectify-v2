import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { getConvexClient } from "@/convex/lib/client"

export async function getPublishedChangelog(projectId: Id<"projects">) {
  const client = getConvexClient()
  return await client.query(api.changelog.listPublishedByProject, { projectId })
}

export async function getPublishedChangelogEntry(
  projectId: Id<"projects">,
  changelogId: Id<"changelog">
) {
  const client = getConvexClient()
  return await client.query(api.changelog.getPublishedEntry, {
    projectId,
    changelogId,
  })
}

export async function authenticateChangelogApiKey(
  projectId: Id<"projects">,
  apiKey: string
) {
  const client = getConvexClient()
  return await client.action(api.changelog.authenticateApiKey, {
    projectId,
    apiKey,
  })
}
