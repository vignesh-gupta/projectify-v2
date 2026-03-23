import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Update current user's profile
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const updates: Record<string, string> = {}
    if (args.name !== undefined) updates.name = args.name
    if (args.email !== undefined) updates.email = args.email
    if (args.image !== undefined) updates.image = args.image

    if (Object.keys(updates).length === 0) {
      throw new Error("No updates provided")
    }

    await ctx.db.patch(userId, updates)
    return userId
  },
})

/**
 * Leave a specific project
 */
export const leaveProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Find user's membership
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    // Check if user is the only owner
    if (membership.role === "owner") {
      const allMemberships = await ctx.db
        .query("memberships")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect()

      const otherOwners = allMemberships.filter(
        (m) => m.role === "owner" && m.userId !== userId
      )

      if (otherOwners.length === 0 && allMemberships.length > 1) {
        throw new Error(
          "Cannot leave: you are the only owner. Please transfer ownership first or delete the project."
        )
      }
    }

    await ctx.db.delete(membership._id)
    return { success: true }
  },
})

/**
 * Leave all projects (used before account deletion)
 */
export const leaveAllProjects = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Get all user's memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    // Check for projects where user is the only owner
    const problematicProjects: string[] = []

    for (const membership of memberships) {
      if (membership.role === "owner") {
        const allProjectMemberships = await ctx.db
          .query("memberships")
          .withIndex("by_project", (q) =>
            q.eq("projectId", membership.projectId)
          )
          .collect()

        const otherOwners = allProjectMemberships.filter(
          (m) => m.role === "owner" && m.userId !== userId
        )

        if (otherOwners.length === 0 && allProjectMemberships.length > 1) {
          const project = await ctx.db.get(membership.projectId)
          if (project) {
            problematicProjects.push(project.title)
          }
        }
      }
    }

    if (problematicProjects.length > 0) {
      throw new Error(
        `Cannot leave these projects where you are the only owner: ${problematicProjects.join(", ")}. Please transfer ownership first.`
      )
    }

    // Delete all memberships
    for (const membership of memberships) {
      await ctx.db.delete(membership._id)
    }

    return { success: true, count: memberships.length }
  },
})

/**
 * Delete current user account
 * This is a destructive operation that removes the user and all their data
 */
export const deleteAccount = mutation({
  args: {
    confirmation: v.string(), // Must type "DELETE" to confirm
  },
  handler: async (ctx, args) => {
    if (args.confirmation !== "DELETE") {
      throw new Error("Invalid confirmation. Type DELETE to confirm.")
    }

    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Leave all projects first (this will fail if user is sole owner)
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    // Check for problematic projects
    const problematicProjects: string[] = []
    for (const membership of memberships) {
      if (membership.role === "owner") {
        const allProjectMemberships = await ctx.db
          .query("memberships")
          .withIndex("by_project", (q) =>
            q.eq("projectId", membership.projectId)
          )
          .collect()

        const otherOwners = allProjectMemberships.filter(
          (m) => m.role === "owner" && m.userId !== userId
        )

        if (otherOwners.length === 0 && allProjectMemberships.length > 1) {
          const project = await ctx.db.get(membership.projectId)
          if (project) {
            problematicProjects.push(project.title)
          }
        }
      }
    }

    if (problematicProjects.length > 0) {
      throw new Error(
        `Cannot delete account. You are the sole owner of: ${problematicProjects.join(", ")}. Please transfer ownership or delete these projects first.`
      )
    }

    // Delete all memberships
    for (const membership of memberships) {
      await ctx.db.delete(membership._id)
    }

    // Delete all tasks created by user
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .collect()

    for (const task of tasks) {
      await ctx.db.delete(task._id)
    }

    // Delete projects where user is sole owner
    const ownedProjects = await ctx.db.query("projects").collect()

    for (const project of ownedProjects) {
      const projectMemberships = await ctx.db
        .query("memberships")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect()

      // If no members left, delete the project
      if (projectMemberships.length === 0) {
        await ctx.db.delete(project._id)
      }
    }

    // Finally, delete the user account
    await ctx.db.delete(userId)

    return { success: true }
  },
})

/**
 * Get user's project memberships with project details
 */
export const getUserProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const projects = await Promise.all(
      memberships.map(async (membership) => {
        const project = await ctx.db.get(membership.projectId)
        if (!project) return null

        // Count members
        const memberCount = await ctx.db
          .query("memberships")
          .withIndex("by_project", (q) =>
            q.eq("projectId", membership.projectId)
          )
          .collect()

        return {
          ...project,
          role: membership.role,
          memberCount: memberCount.length,
          membershipId: membership._id,
        }
      })
    )

    return projects.filter((p) => p !== null)
  },
})
