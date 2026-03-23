import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { Doc, Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

/**
 * Create a new folder
 */
export const createFolder = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("link")),
    parentId: v.optional(v.id("folders")),
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

    const folderId = await ctx.db.insert("folders", {
      projectId: args.projectId,
      name: args.name,
      type: args.type,
      parentId: args.parentId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    })

    return folderId
  },
})

/**
 * Get folders for a project
 */
export const listFolders = query({
  args: {
    projectId: v.id("projects"),
    type: v.union(v.literal("file"), v.literal("link")),
    parentId: v.optional(v.id("folders")),
    hideFolders: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.hideFolders) {
      return []
    }

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

    // Get folders - if parentId is provided, get children of that folder
    // If parentId is undefined, get root folders
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_project_type", (q) =>
        q.eq("projectId", args.projectId).eq("type", args.type)
      )
      .filter((q) =>
        args.parentId
          ? q.eq(q.field("parentId"), args.parentId)
          : q.eq(q.field("parentId"), undefined)
      )
      .collect()

    return folders
  },
})

/**
 * Update folder name
 */
export const updateFolder = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error("Folder not found")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", folder.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    await ctx.db.patch(args.folderId, {
      name: args.name,
      updatedAt: Date.now(),
    })

    return args.folderId
  },
})

/**
 * Delete a folder (and optionally its contents)
 */
export const deleteFolder = mutation({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error("Folder not found")
    }

    // Verify user has permission
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", folder.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    // Only allow admin/owner to delete folders
    if (membership.role === "member") {
      throw new Error("Insufficient permissions")
    }

    // Check if folder has contents
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .first()

    const subfolders = await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) => q.eq("parentId", args.folderId))
      .first()

    if (resources || subfolders) {
      throw new Error("Folder is not empty")
    }

    await ctx.db.delete(args.folderId)
  },
})

/**
 * Delete a folder and all its contents recursively
 */
export const deleteFolderRecursive = mutation({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const folder = await ctx.db.get(args.folderId)
    if (!folder) {
      throw new Error("Folder not found")
    }

    // Verify user has permission
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", folder.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    // Only allow admin/owner to delete folders
    if (membership.role === "member") {
      throw new Error("Insufficient permissions")
    }

    // Recursive helper function
    async function deleteFolderAndContents(folderId: Id<"folders">) {
      // Delete all resources in this folder
      const resources = await ctx.db
        .query("resources")
        .withIndex("by_folder", (q) => q.eq("folderId", folderId))
        .collect()

      for (const resource of resources) {
        // Delete file from storage if it's a file type
        if (resource.type === "file" && resource.storageId) {
          await ctx.storage.delete(resource.storageId)
        }
        await ctx.db.delete(resource._id)
      }

      // Delete all subfolders recursively
      const subfolders = await ctx.db
        .query("folders")
        .withIndex("by_parent", (q) => q.eq("parentId", folderId))
        .collect()

      for (const subfolder of subfolders) {
        await deleteFolderAndContents(subfolder._id)
      }

      // Finally, delete the folder itself
      await ctx.db.delete(folderId)
    }

    await deleteFolderAndContents(args.folderId)
  },
})

/**
 * Get folder path (breadcrumb)
 */
export const getFolderPath = query({
  args: {
    folderId: v.optional(v.id("folders")),
    skipFiles: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.skipFiles) {
      return null
    }

    const path: Array<{ _id: Id<"folders">; name: string }> = []
    let currentId: Id<"folders"> | undefined = args.folderId

    while (currentId) {
      const doc = await ctx.db.get(currentId)

      // Type narrowing: ensure we got a folders document
      if (
        !doc ||
        doc._id.includes("projects") ||
        doc._id.includes("users") ||
        doc._id.includes("resources") ||
        doc._id.includes("tasks") ||
        doc._id.includes("memberships")
      ) {
        break
      }

      const folder = doc as Doc<"folders">

      path.unshift({
        _id: folder._id,
        name: folder.name,
      })

      currentId = folder.parentId
    }

    return path
  },
})
