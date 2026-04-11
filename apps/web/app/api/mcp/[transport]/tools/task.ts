import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { api } from "@/convex/_generated/api"
import { z } from "zod"
import { asId, readAuth, runTool, toIsoDate, toTimestamp, type ToolDeps } from "./shared"

const taskStatusSchema = z.enum(["todo", "in_progress", "done"])
const taskPrioritySchema = z.enum(["low", "medium", "high"])

export function registerTaskTools(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    "tasks_list",
    {
      title: "List tasks",
      description: "List tasks for a project.",
      inputSchema: {
        projectId: z.string(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        assigneeUserId: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ projectId, status, priority, assigneeUserId, limit, offset }, extra) =>
      runTool("tasks_list", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "tasks:read")
        const result = await client.query(api.tasks.listByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          status,
          priority,
          assigneeUserId: assigneeUserId
            ? asId<"users">(assigneeUserId)
            : undefined,
          limit,
          offset,
        })
        return {
          tasks: result.tasks.map((task) => ({
            ...task,
            dueDate: toIsoDate(task.dueDate),
          })),
          total: result.total,
        }
      })
  )

  server.registerTool(
    "tasks_get",
    {
      title: "Get task",
      description: "Get a task by taskId.",
      inputSchema: {
        taskId: z.string(),
      },
    },
    async ({ taskId }, extra) =>
      runTool("tasks_get", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "tasks:read")
        const result = await client.query(api.tasks.getByApiKey, {
          apiKey,
          taskId: asId<"tasks">(taskId),
        })
        return {
          task: {
            ...result.task,
            dueDate: toIsoDate(result.task.dueDate),
          },
        }
      })
  )

  server.registerTool(
    "tasks_create",
    {
      title: "Create task",
      description: "Create a task in a project.",
      inputSchema: {
        projectId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        dueDate: z.string().datetime().optional(),
        assigneeUserId: z.string().optional(),
      },
    },
    async (
      { projectId, title, description, status, priority, dueDate, assigneeUserId },
      extra
    ) =>
      runTool("tasks_create", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "tasks:write")
        const result = await client.mutation(api.tasks.createByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          title: title.trim(),
          description,
          status,
          priority,
          dueDate: toTimestamp(dueDate),
          assigneeUserId: assigneeUserId
            ? asId<"users">(assigneeUserId)
            : undefined,
        })
        return {
          task: {
            ...result.task,
            dueDate: toIsoDate(result.task.dueDate),
          },
        }
      })
  )

  server.registerTool(
    "tasks_update",
    {
      title: "Update task",
      description: "Update a task by taskId.",
      inputSchema: {
        taskId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        dueDate: z.string().datetime().optional(),
        assigneeUserId: z.string().optional(),
      },
    },
    async (
      { taskId, title, description, status, priority, dueDate, assigneeUserId },
      extra
    ) =>
      runTool("tasks_update", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "tasks:write")
        const result = await client.mutation(api.tasks.updateByApiKey, {
          apiKey,
          taskId: asId<"tasks">(taskId),
          title,
          description,
          status,
          priority,
          dueDate: toTimestamp(dueDate),
          assigneeUserId: assigneeUserId
            ? asId<"users">(assigneeUserId)
            : undefined,
        })
        return {
          task: {
            ...result.task,
            dueDate: toIsoDate(result.task.dueDate),
          },
        }
      })
  )

  server.registerTool(
    "tasks_delete",
    {
      title: "Delete task",
      description: "Delete a task by taskId.",
      inputSchema: {
        taskId: z.string(),
      },
    },
    async ({ taskId }, extra) =>
      runTool("tasks_delete", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "tasks:write")
        return await client.mutation(api.tasks.deleteByApiKey, {
          apiKey,
          taskId: asId<"tasks">(taskId),
        })
      })
  )
}

