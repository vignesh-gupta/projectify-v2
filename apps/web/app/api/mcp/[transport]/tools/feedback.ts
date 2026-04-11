import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { api } from "@/convex/_generated/api"
import { z } from "zod"
import { asId, readAuth, runTool, type ToolDeps } from "./shared"

const feedbackStatusSchema = z.enum([
  "new",
  "under_review",
  "planned",
  "in_progress",
  "done",
  "rejected",
])
const feedbackCategorySchema = z.enum(["bug", "feature", "improvement"])

export function registerFeedbackTools(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    "feedback_list",
    {
      title: "List feedback",
      description: "List feedback items for a project.",
      inputSchema: {
        projectId: z.string(),
        status: feedbackStatusSchema.optional(),
        category: feedbackCategorySchema.optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ projectId, status, category, limit, offset }, extra) =>
      runTool("feedback_list", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "feedback:read")
        return await client.query(api.feedback.listByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          status,
          category,
          limit,
          offset,
        })
      })
  )

  server.registerTool(
    "feedback_create",
    {
      title: "Create feedback",
      description: "Create feedback in a project.",
      inputSchema: {
        projectId: z.string(),
        title: z.string().min(1),
        description: z.string().min(1),
        category: feedbackCategorySchema.optional(),
      },
    },
    async ({ projectId, title, description, category }, extra) =>
      runTool("feedback_create", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "feedback:write")
        return await client.mutation(api.feedback.createByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          title: title.trim(),
          description: description.trim(),
          category: category ?? "feature",
        })
      })
  )

  server.registerTool(
    "feedback_vote",
    {
      title: "Vote feedback",
      description: "Vote for a feedback item by feedbackId.",
      inputSchema: {
        feedbackId: z.string(),
      },
    },
    async ({ feedbackId }, extra) =>
      runTool("feedback_vote", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "feedback:write")
        return await client.mutation(api.feedback.voteByApiKey, {
          apiKey,
          feedbackId: asId<"feedback">(feedbackId),
        })
      })
  )
}

