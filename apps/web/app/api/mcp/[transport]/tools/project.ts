import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { api } from "@/convex/_generated/api"
import { z } from "zod"
import { asId, readAuth, runTool, toIsoDate, toTimestamp, type ToolDeps } from "./shared"

const projectStatusSchema = z.enum(["development", "maintenance", "inactive"])

export function registerProjectTools(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    "projects_list",
    {
      title: "List projects",
      description: "List projects available to the API key user.",
      inputSchema: {
        status: projectStatusSchema.optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ status, limit, offset }, extra) =>
      runTool("projects_list", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:read")
        const result = await client.query(api.projects.listByApiKey, {
          apiKey,
          status,
          limit,
          offset,
        })
        return {
          projects: result.projects.map((project) => ({
            ...project,
            dueDate: toIsoDate(project.dueDate),
          })),
          total: result.total,
        }
      })
  )

  server.registerTool(
    "projects_get",
    {
      title: "Get project",
      description: "Get detailed information about a project by its ID.",
      inputSchema: {
        projectId: z.string(),
      },
    },
    async ({ projectId }, extra) =>
      runTool("projects_get", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:read")
        const result = await client.query(api.projects.getByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
        })
        return {
          project: {
            ...result.project,
            dueDate: toIsoDate(result.project.dueDate),
          },
        }
      })
  )

  server.registerTool(
    "projects_create",
    {
      title: "Create project",
      description: "Create a project.",
      inputSchema: {
        title: z.string().min(1),
        description: z.string().optional(),
        status: projectStatusSchema.optional(),
        dueDate: z.string().datetime().optional(),
        icon: z.string().optional(),
      },
    },
    async ({ title, description, status, dueDate, icon }, extra) =>
      runTool("projects_create", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:write")
        const result = await client.mutation(api.projects.createByApiKey, {
          apiKey,
          title: title.trim(),
          description,
          status,
          dueDate: toTimestamp(dueDate),
          icon,
        })
        return {
          project: {
            ...result.project,
            dueDate: toIsoDate(result.project.dueDate),
          },
        }
      })
  )

  server.registerTool(
    "projects_update",
    {
      title: "Update project",
      description: "Update a project by projectId.",
      inputSchema: {
        projectId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: projectStatusSchema.optional(),
        dueDate: z.string().datetime().optional(),
      },
    },
    async ({ projectId, title, description, status, dueDate }, extra) =>
      runTool("projects_update", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:write")
        const result = await client.mutation(api.projects.updateByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          title,
          description,
          status,
          dueDate: toTimestamp(dueDate),
        })
        return {
          project: {
            ...result.project,
            dueDate: toIsoDate(result.project.dueDate),
          },
        }
      })
  )

  server.registerTool(
    "projects_delete",
    {
      title: "Delete project",
      description: "Delete a project by projectId.",
      inputSchema: {
        projectId: z.string(),
      },
    },
    async ({ projectId }, extra) =>
      runTool("projects_delete", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:write")
        return await client.mutation(api.projects.deleteByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
        })
      })
  )
}

