import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { api } from "@/convex/_generated/api"
import { z } from "zod"
import { asId, readAuth, runTool, type ToolDeps } from "./shared"

const changelogStatusSchema = z.enum(["draft", "published"])

export function registerChangelogTools(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    "changelog_list",
    {
      title: "List changelog entries",
      description: "List changelog entries for a project.",
      inputSchema: {
        projectId: z.string(),
        status: changelogStatusSchema.optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ projectId, status, limit, offset }, extra) =>
      runTool("changelog_list", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "changelog:read")
        return await client.query(api.changelog.listByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          status,
          limit,
          offset,
        })
      })
  )

  server.registerTool(
    "changelog_get_published_entry",
    {
      title: "Get published changelog entry",
      description: "Get a single published changelog entry.",
      inputSchema: {
        projectId: z.string(),
        changelogId: z.string(),
      },
    },
    async ({ projectId, changelogId }, extra) =>
      runTool("changelog_get_published_entry", async () => {
        readAuth(extra, "changelog:read")
        const data = await deps.getPublishedChangelogEntry(
          asId<"projects">(projectId),
          asId<"changelog">(changelogId)
        )
        return {
          success: true,
          project: data.project,
          entry: {
            ...data.entry,
            contentHtml: deps.renderChangelogContent(data.entry.content),
          },
        }
      })
  )

  server.registerTool(
    "changelog_create_draft",
    {
      title: "Create changelog draft",
      description: "Create a changelog draft.",
      inputSchema: {
        projectId: z.string(),
        version: z.string().min(1),
        title: z.string().min(1),
        content: z.string().min(1),
      },
    },
    async ({ projectId, version, title, content }, extra) =>
      runTool("changelog_create_draft", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "changelog:write")
        return await client.mutation(api.changelog.createDraftByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          version,
          title,
          content,
        })
      })
  )

  server.registerTool(
    "changelog_publish",
    {
      title: "Publish changelog entry",
      description: "Publish a changelog entry by changelogId.",
      inputSchema: {
        changelogId: z.string(),
      },
    },
    async ({ changelogId }, extra) =>
      runTool("changelog_publish", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "changelog:write")
        return await client.mutation(api.changelog.publishByApiKey, {
          apiKey,
          changelogId: asId<"changelog">(changelogId),
        })
      })
  )
}

