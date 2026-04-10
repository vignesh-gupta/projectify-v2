import { v } from "convex/values"
import type { Doc, Id } from "./_generated/dataModel"
import type { QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"

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

async function authenticateApiKey(
  ctx: QueryCtx,
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

function requireScope(scopes: string[], required: string): void {
  if (!scopes.includes(required)) {
    throw new Error("Forbidden: missing required scope")
  }
}

async function requireProjectMembership(
  ctx: QueryCtx,
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

function serializeProject(project: Doc<"projects">) {
  return {
    id: project._id,
    title: project.title,
    description: project.description,
    status: project.status,
    dueDate: project.dueDate,
    icon: project.iconName ?? null,
  }
}

function serializeTask(task: Doc<"tasks">) {
  return {
    id: task._id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    assigneeUserId: task.assigneeUserId,
  }
}

export const validateApiKey = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const auth = await authenticateApiKey(ctx, args.apiKey)
      const user = await ctx.db.get(auth.userId)
      return {
        valid: true as const,
        user: {
          id: auth.userId,
          name: user?.name ?? "",
          email: user?.email ?? "",
        },
      }
    } catch (error) {
      return {
        valid: false as const,
        error: error instanceof Error ? error.message : "Invalid API key",
      }
    }
  },
})

export const listProjects = query({
  args: {
    apiKey: v.string(),
    status: v.optional(
      v.union(
        v.literal("development"),
        v.literal("maintenance"),
        v.literal("inactive")
      )
    ),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:read")

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", auth.userId))
      .collect()

    const projects = (
      await Promise.all(
        memberships.map((membership) => ctx.db.get(membership.projectId))
      )
    ).filter((item) => item !== null)

    const filtered = args.status
      ? projects.filter((project) => project.status === args.status)
      : projects

    const offset = Math.max(0, args.offset ?? 0)
    const limit = Math.max(1, Math.min(1000, args.limit ?? 50))
    const paginated = filtered.slice(offset, offset + limit)

    return {
      projects: paginated.map(serializeProject),
      total: filtered.length,
    }
  },
})

export const createProject = mutation({
  args: {
    apiKey: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("development"),
        v.literal("maintenance"),
        v.literal("inactive")
      )
    ),
    dueDate: v.optional(v.number()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:write")

    const now = Date.now()
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description ?? "",
      status: args.status ?? "development",
      dueDate: args.dueDate,
      iconName: args.icon,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert("memberships", {
      projectId,
      userId: auth.userId,
      role: "owner",
      joinedAt: now,
    })

    const project = await ctx.db.get(projectId)
    if (!project) {
      throw new Error("Failed to create project")
    }

    return { project: serializeProject(project) }
  },
})

export const getProject = query({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:read")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      throw new Error("Project not found")
    }

    return { project: serializeProject(project) }
  },
})

export const deleteProject = mutation({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:write")

    const membership = await requireProjectMembership(
      ctx,
      args.projectId,
      auth.userId
    )
    if (membership.role === "member") {
      throw new Error("Forbidden: only owners/admins can delete projects")
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const task of tasks) {
      await ctx.db.delete(task._id)
    }

    const resources = await ctx.db
      .query("resources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const resource of resources) {
      await ctx.db.delete(resource._id)
    }

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const folder of folders) {
      await ctx.db.delete(folder._id)
    }

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const projectMembership of memberships) {
      await ctx.db.delete(projectMembership._id)
    }

    await ctx.db.delete(args.projectId)

    return {
      success: true,
      message: "Project deleted successfully",
    }
  },
})

export const listTasks = query({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    status: v.optional(
      v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    assigneeUserId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "tasks:read")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    const filtered = tasks.filter((task) => {
      if (args.status && task.status !== args.status) return false
      if (args.priority && task.priority !== args.priority) return false
      if (args.assigneeUserId && task.assigneeUserId !== args.assigneeUserId)
        return false
      return true
    })

    const offset = Math.max(0, args.offset ?? 0)
    const limit = Math.max(1, Math.min(1000, args.limit ?? 50))
    const paginated = filtered.slice(offset, offset + limit)

    return {
      tasks: paginated.map(serializeTask),
      total: filtered.length,
    }
  },
})

export const createTask = mutation({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueDate: v.optional(v.number()),
    assigneeUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "tasks:write")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

    const now = Date.now()
    const taskId = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: args.status ?? "todo",
      priority: args.priority ?? "medium",
      dueDate: args.dueDate,
      assigneeUserId: args.assigneeUserId,
      createdAt: now,
      updatedAt: now,
      createdBy: auth.userId,
    })

    const task = await ctx.db.get(taskId)
    if (!task) {
      throw new Error("Failed to create task")
    }

    return { task: serializeTask(task) }
  },
})

export const getTask = query({
  args: {
    apiKey: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "tasks:read")

    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    await requireProjectMembership(ctx, task.projectId, auth.userId)
    return { task: serializeTask(task) }
  },
})

export const updateTask = mutation({
  args: {
    apiKey: v.string(),
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueDate: v.optional(v.number()),
    assigneeUserId: v.optional(v.id("users")),
    clearAssignee: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "tasks:write")

    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    await requireProjectMembership(ctx, task.projectId, auth.userId)

    const patchData: Partial<Doc<"tasks">> & { updatedAt: number } = {
      updatedAt: Date.now(),
    }

    if (args.title !== undefined) patchData.title = args.title
    if (args.description !== undefined) patchData.description = args.description
    if (args.status !== undefined) patchData.status = args.status
    if (args.priority !== undefined) patchData.priority = args.priority
    if (args.dueDate !== undefined) patchData.dueDate = args.dueDate
    if (args.assigneeUserId !== undefined)
      patchData.assigneeUserId = args.assigneeUserId
    if (args.clearAssignee) patchData.assigneeUserId = undefined

    if (Object.keys(patchData).length === 1) {
      throw new Error("At least one field is required to update")
    }

    await ctx.db.patch(args.taskId, patchData)
    const updatedTask = await ctx.db.get(args.taskId)
    if (!updatedTask) {
      throw new Error("Task not found")
    }

    return { task: serializeTask(updatedTask) }
  },
})

export const deleteTask = mutation({
  args: {
    apiKey: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "tasks:write")

    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    const membership = await requireProjectMembership(
      ctx,
      task.projectId,
      auth.userId
    )
    if (membership.role === "member" && task.createdBy !== auth.userId) {
      throw new Error("Forbidden: insufficient permissions")
    }

    await ctx.db.delete(args.taskId)

    return {
      success: true,
      message: "Task deleted successfully",
    }
  },
})
