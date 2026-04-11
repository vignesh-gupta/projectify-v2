import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authenticateApiKey, requireProjectMembership, requireScope } from "./lib/apiKeyAuth"

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
    type: v.union(v.literal("file"), v.literal("link")),
    folderId: v.optional(v.id("folders")),
    limit: v.optional(v.number()),
    showAll: v.optional(v.boolean()),
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

    if (args.showAll) {
      // If showAll is true, ignore folderId and return all resources of the specified type for the project
      const resources = await ctx.db
        .query("resources")
        .withIndex("by_project_type", (q) =>
          q.eq("projectId", args.projectId).eq("type", args.type)
        )
        .order("desc")
        .take(args.limit || 1000)
      return resources
    }

    // Query by folder (including null for root)
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_project_folder", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("folderId", args.folderId === null ? undefined : args.folderId)
      )
      .filter((q) => (args.type ? q.eq(q.field("type"), args.type) : true))
      .order("desc")
      .take(args.limit || 1000)

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

/**
 * Search resources by name
 */
export const searchResources = query({
  args: {
    projectId: v.id("projects"),
    query: v.string(),
    type: v.optional(v.union(v.literal("file"), v.literal("link"))),
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

    // Get all resources for the project
    let resources = await ctx.db
      .query("resources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    // Filter by type if specified
    if (args.type) {
      resources = resources.filter((r) => r.type === args.type)
    }

    // Filter by folder if specified
    if (args.folderId) {
      resources = resources.filter((r) => r.folderId === args.folderId)
    }

    // Search by name (case-insensitive)
    const searchQuery = args.query.toLowerCase()
    resources = resources.filter((r) =>
      r.name.toLowerCase().includes(searchQuery)
    )

    // Get folder paths for context
    const resourcesWithPath = await Promise.all(
      resources.map(async (resource) => {
        let folderPath: string[] = []

        if (resource.folderId) {
          const path = await ctx.db
            .query("folders")
            .filter((q) => q.eq(q.field("_id"), resource.folderId))
            .first()

          if (path) {
            // Get full folder path
            const pathResult = await ctx.db
              .query("folders")
              .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
              .collect()

            // Build folder path breadcrumb
            const buildPath = (folderId: string): string[] => {
              const folder = pathResult.find((f) => f._id === folderId)
              if (!folder) return []

              if (folder.parentId) {
                return [...buildPath(folder.parentId), folder.name]
              }
              return [folder.name]
            }

            folderPath = buildPath(resource.folderId)
          }
        }

        return {
          ...resource,
          folderPath,
        }
      })
    )

    return resourcesWithPath
  },
})

export const generateUploadUrlByApiKey = mutation({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:write")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

    return await ctx.storage.generateUploadUrl()
  },
})

export const createFileByApiKey = mutation({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    name: v.string(),
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileSize: v.number(),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:write")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

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
      createdBy: auth.userId,
    })

    const resource = await ctx.db.get(resourceId)
    if (!resource) {
      throw new Error("Failed to create resource")
    }

    return {
      resource: {
        id: resource._id,
        projectId: resource.projectId,
        type: resource.type,
        name: resource.name,
        storageId: resource.storageId,
        fileType: resource.fileType,
        fileSize: resource.fileSize,
        folderId: resource.folderId,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
      },
    }
  },
})

export const createLinkByApiKey = mutation({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    name: v.string(),
    url: v.string(),
    favicon: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:write")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

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
      createdBy: auth.userId,
    })

    const resource = await ctx.db.get(resourceId)
    if (!resource) {
      throw new Error("Failed to create resource")
    }

    return {
      resource: {
        id: resource._id,
        projectId: resource.projectId,
        type: resource.type,
        name: resource.name,
        url: resource.url,
        favicon: resource.favicon,
        folderId: resource.folderId,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
      },
    }
  },
})

export const listByApiKey = query({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    type: v.optional(v.union(v.literal("file"), v.literal("link"))),
    folderId: v.optional(v.id("folders")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:read")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

    let resources = await ctx.db
      .query("resources")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    if (args.type) {
      resources = resources.filter((resource) => resource.type === args.type)
    }
    if (args.folderId) {
      resources = resources.filter((resource) => resource.folderId === args.folderId)
    }

    const sorted = resources.sort((a, b) => b.updatedAt - a.updatedAt)
    const offset = Math.max(0, args.offset ?? 0)
    const limit = Math.max(1, Math.min(1000, args.limit ?? 50))
    const paginated = sorted.slice(offset, offset + limit)

    return {
      resources: paginated.map((resource) => ({
        id: resource._id,
        projectId: resource.projectId,
        type: resource.type,
        name: resource.name,
        url: resource.url,
        storageId: resource.storageId,
        fileType: resource.fileType,
        fileSize: resource.fileSize,
        favicon: resource.favicon,
        folderId: resource.folderId,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
      })),
      total: sorted.length,
    }
  },
})
