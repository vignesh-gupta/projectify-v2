import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

/**
 * Add a member to a project
 */
export const add = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error("Unauthorized");
    }

    // Check if current user has admin or owner role
    const currentMembership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", currentUserId)
      )
      .first();

    if (!currentMembership || currentMembership.role === "member") {
      throw new Error("Insufficient permissions");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member");
    }

    return await ctx.db.insert("memberships", {
      projectId: args.projectId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });
  },
});

/**
 * Update a member's role
 */
export const updateRole = mutation({
  args: {
    membershipId: v.id("memberships"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    // Check if current user has owner role
    const currentMembership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", membership.projectId).eq("userId", userId)
      )
      .first();

    if (!currentMembership || currentMembership.role !== "owner") {
      throw new Error("Only owners can change roles");
    }

    await ctx.db.patch(args.membershipId, {
      role: args.role,
    });

    return args.membershipId;
  },
});

/**
 * Remove a member from a project
 */
export const remove = mutation({
  args: {
    membershipId: v.id("memberships"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    // Check if current user has admin or owner role, or is removing themselves
    const currentMembership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", membership.projectId).eq("userId", userId)
      )
      .first();

    const isSelf = membership.userId === userId;
    const hasPermission =
      currentMembership &&
      (currentMembership.role === "owner" || currentMembership.role === "admin");

    if (!isSelf && !hasPermission) {
      throw new Error("Insufficient permissions");
    }

    await ctx.db.delete(args.membershipId);
  },
});

/**
 * Get all members of a project
 */
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this project");
    }

    return await ctx.db
      .query("memberships")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});
