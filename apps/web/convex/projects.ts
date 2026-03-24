import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Create a new project
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("development"),
      v.literal("maintenance"),
      v.literal("inactive")
    ),
    dueDate: v.optional(v.number()),
    iconStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized - Create")
    }

    const now = Date.now()

    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      status: args.status,
      dueDate: args.dueDate,
      iconStorageId: args.iconStorageId,
      createdAt: now,
      updatedAt: now,
    })

    // Add creator as project owner
    await ctx.db.insert("memberships", {
      projectId,
      userId,
      role: "owner",
      joinedAt: now,
    })

    return projectId
  },
})

/**
 * Get all projects for the current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    // Get user's project memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    // Get full project details
    const projects = await Promise.all(
      memberships.map(async (membership) => {
        const project = await ctx.db.get(membership.projectId)
        return {
          ...project,
          role: membership.role,
        }
      })
    )

    return projects.filter((p) => p !== null)
  },
})

/**
 * Update a project
 */
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("development"),
        v.literal("maintenance"),
        v.literal("inactive")
      )
    ),
    dueDate: v.optional(v.number()),
    iconStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized - Update")
    }

    // Check if user has admin or owner role
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership || membership.role === "member") {
      throw new Error("Insufficient permissions")
    }

    const { projectId, ...updates } = args
    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    })

    return projectId
  },
})

/**
 * Get project by ID with membership verification
 */
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)

    if (!userId) {
      throw new Error("Unauthorized - get Project")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("You don't have access to this project")
    }

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      throw new Error("Project not found")
    }

    return {
      ...project,
      role: membership.role,
    }
  },
})

/**
 * Get project analytics/stats
 */
export const getProjectAnalytics = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized - Analytics")
    }

    // Verify user is a member
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("You don't have access to this project")
    }

    // Get all tasks for the project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    // Calculate task statistics
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
      highPriority: tasks.filter((t) => t.priority === "high").length,
      mediumPriority: tasks.filter((t) => t.priority === "medium").length,
      lowPriority: tasks.filter((t) => t.priority === "low").length,
    }

    // Get team member count
    const members = await ctx.db
      .query("memberships")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    const teamStats = {
      total: members.length,
      owners: members.filter((m) => m.role === "owner").length,
      admins: members.filter((m) => m.role === "admin").length,
      members: members.filter((m) => m.role === "member").length,
    }

    // Get overdue tasks
    const now = Date.now()
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== "done"
    ).length

    return {
      tasks: taskStats,
      team: teamStats,
      overdueTasks,
      completionRate:
        taskStats.total > 0
          ? Math.round((taskStats.done / taskStats.total) * 100)
          : 0,
    }
  },
})

/**
 * Generate upload URL for project icon
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized - Upload URL")
    }
    return await ctx.storage.generateUploadUrl()
  },
})
