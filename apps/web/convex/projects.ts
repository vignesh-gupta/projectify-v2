import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"
import {
  authenticateApiKey,
  requireProjectMembership,
  requireScope,
} from "./lib/apiKeyAuth"

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

export const listByApiKey = query({
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

/**
 * Get all projects for the current user with enriched data (members, tasks, progress)
 */
export const listWithDetails = query({
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

    // Get full project details with enriched data
    const projects = await Promise.all(
      memberships.map(async (membership) => {
        const project = await ctx.db.get(membership.projectId)
        if (!project) return null

        // Get all team members for this project
        const projectMemberships = await ctx.db
          .query("memberships")
          .withIndex("by_project", (q) => q.eq("projectId", membership.projectId))
          .collect()

        // Get user details for each member
        const members = await Promise.all(
          projectMemberships.map(async (m) => {
            const user = await ctx.db.get(m.userId)
            return user
              ? {
                  id: m.userId,
                  name: user.name ?? "Unknown",
                  email: user.email ?? "",
                  image: user.image,
                }
              : null
          })
        )

        // Get all tasks for this project
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", membership.projectId))
          .collect()

        // Calculate progress based on completed tasks
        const completedTasks = tasks.filter((t) => t.status === "done").length
        const totalTasks = tasks.length
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return {
          ...project,
          role: membership.role,
          members: members.filter((m) => m !== null),
          progress,
          totalTasks,
          completedTasks,
        }
      })
    )

    return projects.filter((p) => p !== null)
  },
})

/**
 * Get icon URL from storage
 */
export const getIconUrl = query({
  args: { storageId: v.optional(v.id("_storage")) },
  handler: async (ctx, args) => {
    if (!args.storageId) {
      return null
    }

    return await ctx.storage.getUrl(args.storageId)
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
    iconName: v.optional(v.string()),
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
    
    // Build update object, handling icon clearing logic
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: Date.now(),
    }
    
    // If iconStorageId is provided (even if undefined), handle icon clearing
    if ("iconStorageId" in args) {
      if (args.iconStorageId) {
        // New storage icon: set it and clear iconName
        updateData.iconStorageId = args.iconStorageId
        updateData.iconName = undefined
      } else {
        // Explicitly clearing storage icon
        updateData.iconStorageId = undefined
      }
    }
    
    // If iconName is provided (even if undefined), handle icon clearing
    if ("iconName" in args) {
      if (args.iconName) {
        // New icon name: set it and clear iconStorageId
        updateData.iconName = args.iconName
        updateData.iconStorageId = undefined
      } else {
        // Explicitly clearing icon name
        updateData.iconName = undefined
      }
    }

    await ctx.db.patch(projectId, updateData)

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

export const getByApiKey = query({
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
 * Clear all project data (tasks, resources, folders) without deleting the project
 */
export const clearProjectData = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized - Clear Data")
    }

    // Check if user has admin or owner role
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership || membership.role === "member") {
      throw new Error("Only owners and admins can clear project data")
    }

    // Delete all tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const task of tasks) {
      await ctx.db.delete(task._id)
    }

    // Delete all resources
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const resource of resources) {
      await ctx.db.delete(resource._id)
    }

    // Delete all folders
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const folder of folders) {
      await ctx.db.delete(folder._id)
    }

    return {
      success: true,
      cleared: {
        tasks: tasks.length,
        resources: resources.length,
        folders: folders.length,
      },
    }
  },
})

/**
 * Delete a project and all related data
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized - Delete Project")
    }

    // Check if user has admin or owner role
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership || membership.role === "member") {
      throw new Error("Only owners and admins can delete projects")
    }

    // Delete all tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const task of tasks) {
      await ctx.db.delete(task._id)
    }

    // Delete all resources
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const resource of resources) {
      await ctx.db.delete(resource._id)
    }

    // Delete all folders
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const folder of folders) {
      await ctx.db.delete(folder._id)
    }

    // Delete all memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    for (const m of memberships) {
      await ctx.db.delete(m._id)
    }

    // Finally, delete the project
    await ctx.db.delete(args.projectId)

    return { success: true }
  },
})

export const createByApiKey = mutation({
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

export const deleteByApiKey = mutation({
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
