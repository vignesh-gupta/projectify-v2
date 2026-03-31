import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Generate upload URL for file upload
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Create a file resource after upload
 */
export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
    folderId: v.optional(v.id("folders")),
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

    const resourceId = await ctx.db.insert("resources", {
      projectId: args.projectId,
      type: "file",
      name: args.name,
      storageId: args.storageId,
      fileType: args.fileType,
      fileSize: args.fileSize,
      folderId: args.folderId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    })

    return resourceId
  },
})

/**
 * Create a link resource
 */
export const createLink = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    url: v.string(),
    favicon: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
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

    const resourceId = await ctx.db.insert("resources", {
      projectId: args.projectId,
      type: "link",
      name: args.name,
      url: args.url,
      favicon: args.favicon,
      folderId: args.folderId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    })

    return resourceId
  },
})

/**
 * Get all resources for a project
 */
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    type: v.optional(v.union(v.literal("file"), v.literal("link"))),
    folderId: v.optional(v.union(v.id("folders"), v.null())),
    limit: v.optional(v.number()),
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

    // Build query based on arguments
    let resources

    if (!args.folderId) {
      // Query by folder (including null for root)
      resources = await ctx.db
        .query("resources")
        .withIndex("by_project_folder", (q) =>
          q
            .eq("projectId", args.projectId)
            .eq("folderId", args.folderId === null ? undefined : args.folderId)
        )
        .filter((q) => (args.type ? q.eq(q.field("type"), args.type) : true))
        .order("desc")
        .take(args.limit || 1000)
    } else if (args.type) {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_project_type", (q) =>
          q.eq("projectId", args.projectId).eq("type", args.type!)
        )
        .order("desc")
        .take(args.limit || 1000)
    } else {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(args.limit || 1000)
    }

    return resources
  },
})

/**
 * Update a resource (rename)
 */
export const update = mutation({
  args: {
    resourceId: v.id("resources"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    favicon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const resource = await ctx.db.get(args.resourceId)
    if (!resource) {
      throw new Error("Resource not found")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", resource.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const { resourceId, ...updates } = args
    await ctx.db.patch(resourceId, {
      ...updates,
      updatedAt: Date.now(),
    })

    return resourceId
  },
})

/**
 * Delete a resource
 */
export const remove = mutation({
  args: {
    resourceId: v.id("resources"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const resource = await ctx.db.get(args.resourceId)
    if (!resource) {
      throw new Error("Resource not found")
    }

    // Verify user has permission
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", resource.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    // Only allow admin/owner or creator to delete
    if (membership.role === "member" && resource.createdBy !== userId) {
      throw new Error("Insufficient permissions")
    }

    // Delete the file from storage if it's a file resource
    if (resource.type === "file" && resource.storageId) {
      await ctx.storage.delete(resource.storageId)
    }

    await ctx.db.delete(args.resourceId)
  },
})

/**
 * Delete multiple resources at once
 */
export const deleteResources = mutation({
  args: {
    resourceIds: v.array(v.id("resources")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    for (const resourceId of args.resourceIds) {
      const resource = await ctx.db.get(resourceId)
      if (!resource) {
        continue // Skip if resource not found
      }

      // Verify user has permission
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", resource.projectId).eq("userId", userId)
        )
        .first()

      if (!membership) {
        throw new Error("Not a member of this project")
      }

      // Only allow admin/owner or creator to delete
      if (membership.role === "member" && resource.createdBy !== userId) {
        throw new Error("Insufficient permissions")
      }

      // Delete the file from storage if it's a file resource
      if (resource.type === "file" && resource.storageId) {
        await ctx.storage.delete(resource.storageId)
      }

      await ctx.db.delete(resourceId)
    }
  },
})

/**
 * Get download URL for a file
 */
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

/**
 * Move a resource to a different folder
 */
export const moveResource = mutation({
  args: {
    resourceId: v.id("resources"),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const resource = await ctx.db.get(args.resourceId)
    if (!resource) {
      throw new Error("Resource not found")
    }

    // Check if user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", resource.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not authorized to modify this resource")
    }

    // Update the resource's folderId
    await ctx.db.patch(args.resourceId, {
      folderId: args.folderId,
      updatedAt: Date.now(),
    })
  },
})
