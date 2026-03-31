import { v } from "convex/values"
import { query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Get all members of a project for @mention autocomplete
export const getProjectMembers = query({
  args: {
    projectId: v.id("projects"),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    // Check if user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      return []
    }

    // Get all members of the project
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    // Get user details for each member
    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId)
        return {
          _id: user?._id,
          name: user?.name ?? null,
          email: user?.email ?? "",
          image: user?.image,
        }
      })
    )

    // Filter out null users and optionally filter by search query
    let filteredMembers = members.filter((m) => m._id)

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase()
      filteredMembers = filteredMembers.filter(
        (m) =>
          m.name?.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
      )
    }

    return filteredMembers
  },
})
