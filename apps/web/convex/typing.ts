import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Set typing status for a user in a project
export const setTyping = mutation({
  args: {
    projectId: v.id("projects"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    // Check if user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    // Find existing typing status
    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .first()

    const now = Date.now()

    if (existing) {
      if (args.isTyping) {
        // Update last typing time
        await ctx.db.patch(existing._id, {
          lastTypingAt: now,
        })
      } else {
        // Remove typing status when stopped
        await ctx.db.delete(existing._id)
      }
    } else if (args.isTyping) {
      // Create new typing status
      await ctx.db.insert("typingStatus", {
        userId,
        projectId: args.projectId,
        lastTypingAt: now,
      })
    }
  },
})

// Get users currently typing in a project
export const getTypingUsers = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    // Get typing statuses from last 5 seconds
    const fiveSecondsAgo = Date.now() - 5000
    const typingStatuses = await ctx.db
      .query("typingStatus")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.gt(q.field("lastTypingAt"), fiveSecondsAgo))
      .collect()

    // Filter out current user and get user details
    const otherUsers = typingStatuses.filter((status) => status.userId !== userId)

    const usersWithDetails = await Promise.all(
      otherUsers.map(async (status) => {
        const user = await ctx.db.get(status.userId)
        return {
          _id: user?._id,
          name: user?.name ?? null,
          email: user?.email ?? "",
        }
      })
    )

    return usersWithDetails.filter((u) => u._id)
  },
})
