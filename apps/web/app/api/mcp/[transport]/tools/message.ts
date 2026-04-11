import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { api } from "@/convex/_generated/api"
import { z } from "zod"
import { asId, readAuth, runTool, type ToolDeps } from "./shared"

export function registerMessageTools(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    "messages_list",
    {
      title: "List messages",
      description: "List messages for a project.",
      inputSchema: {
        projectId: z.string(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ projectId, limit, offset }, extra) =>
      runTool("messages_list", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:read")
        return await client.query(api.messages.listByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          limit,
          offset,
        })
      })
  )

  server.registerTool(
    "messages_send",
    {
      title: "Send message",
      description: "Send a message to a project.",
      inputSchema: {
        projectId: z.string(),
        content: z.string().min(1),
        threadId: z.string().optional(),
      },
    },
    async ({ projectId, content, threadId }, extra) =>
      runTool("messages_send", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:write")
        return await client.mutation(api.messages.sendByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          content: content.trim(),
          threadId: threadId ? asId<"messages">(threadId) : undefined,
        })
      })
  )
}

