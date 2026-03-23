import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Create a new task
 */
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    assigneeUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const now = Date.now()

    const taskId = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      dueDate: args.dueDate,
      assigneeUserId: args.assigneeUserId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    })

    return taskId
  },
})

/**
 * Get all tasks for a project
 */
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(
      v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    // Get tasks with optional status filter
    if (args.status) {
      const status = args.status // TypeScript type narrowing
      return await ctx.db
        .query("tasks")
        .withIndex("by_project_status", (q) =>
          q.eq("projectId", args.projectId).eq("status", status)
        )
        .collect()
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
  },
})

/**
 * Update a task
 */
export const update = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", task.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const { taskId, ...updates } = args
    await ctx.db.patch(taskId, {
      ...updates,
      updatedAt: Date.now(),
    })

    return taskId
  },
})

/**
 * Delete a task
 */
export const remove = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    // Verify user has permission (admin/owner or task creator)
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", task.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    if (membership.role === "member" && task.createdBy !== userId) {
      throw new Error("Insufficient permissions")
    }

    await ctx.db.delete(args.taskId)
  },
})
