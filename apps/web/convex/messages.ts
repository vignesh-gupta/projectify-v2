import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

// Generate upload URL for file attachments
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

// Get attachment URL from storage
export const getAttachmentUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

// Send a new message
export const send = mutation({
  args: {
    projectId: v.id("projects"),
    content: v.string(),
    threadId: v.optional(v.id("messages")),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          type: v.string(),
        })
      )
    ),
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

    // If replying to a thread, verify the parent message exists
    if (args.threadId) {
      const parentMessage = await ctx.db.get(args.threadId)
      if (!parentMessage) {
        throw new Error("Parent message not found")
      }
      if (parentMessage.projectId !== args.projectId) {
        throw new Error("Parent message belongs to different project")
      }
    }

    // If there are attachments, ensure messages folder exists and create resource entries
    let messagesFolderId: Id<"folders"> | undefined
    if (args.attachments && args.attachments.length > 0) {
      // Check if messages folder already exists
      const existingFolder = await ctx.db
        .query("folders")
        .withIndex("by_project_type", (q) =>
          q.eq("projectId", args.projectId).eq("type", "file")
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("name"), "messages"),
            q.eq(q.field("parentId"), undefined)
          )
        )
        .first()

      if (existingFolder) {
        messagesFolderId = existingFolder._id
      } else {
        // Create messages folder
        const now = Date.now()
        messagesFolderId = await ctx.db.insert("folders", {
          projectId: args.projectId,
          name: "messages",
          type: "file",
          parentId: undefined,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        })
      }

      const attachmentsInsertPromises = []

      // Create resource entries for each attachment
      const now = Date.now()
      for (const attachment of args.attachments) {
        const res = ctx.db.insert("resources", {
          projectId: args.projectId,
          type: "file",
          name: attachment.name,
          folderId: messagesFolderId,
          storageId: attachment.storageId,
          fileType: attachment.type,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        })
        attachmentsInsertPromises.push(res)
      }
      await Promise.all(attachmentsInsertPromises)
    }

    const messageId = await ctx.db.insert("messages", {
      projectId: args.projectId,
      authorId: userId,
      content: args.content,
      threadId: args.threadId,
      attachments: args.attachments,
      reactions: [],
      createdAt: Date.now(),
    })

    return messageId
  },
})

// List messages for a project
export const list = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
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

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .filter((q) => q.eq(q.field("threadId"), undefined)) // Only root messages
      .order("desc")
      .take(args.limit ?? 50)

    // Get author details for each message
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        const author = await ctx.db.get(message.authorId)
        return {
          ...message,
          author: author
            ? {
                _id: author._id,
                name: author.name ?? null,
                email: author.email ?? "",
                image: author.image,
              }
            : null,
        }
      })
    )

    return messagesWithAuthors.reverse()
  },
})

// Get thread messages (replies to a message)
export const getThread = query({
  args: {
    threadId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    // Get the parent message to verify project access
    const parentMessage = await ctx.db.get(args.threadId)
    if (!parentMessage) {
      throw new Error("Parent message not found")
    }

    // Check if user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", parentMessage.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const replies = await ctx.db
      .query("messages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()

    // Get author details for each reply
    const repliesWithAuthors = await Promise.all(
      replies.map(async (message) => {
        const author = await ctx.db.get(message.authorId)
        return {
          ...message,
          author: author
            ? {
                _id: author._id,
                name: author.name ?? null,
                email: author.email ?? "",
                image: author.image,
              }
            : null,
        }
      })
    )

    return repliesWithAuthors
  },
})

// Update a message
export const update = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error("Message not found")
    }

    if (message.authorId !== userId) {
      throw new Error("Not authorized to edit this message")
    }

    if (message.deletedAt) {
      throw new Error("Cannot edit deleted message")
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      updatedAt: Date.now(),
    })

    return args.messageId
  },
})

// Delete a message (soft delete)
export const remove = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error("Message not found")
    }

    // Check if user is the author or has admin/owner role
    if (message.authorId !== userId) {
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", message.projectId).eq("userId", userId)
        )
        .first()

      if (!membership || membership.role === "member") {
        throw new Error("Not authorized to delete this message")
      }
    }

    await ctx.db.patch(args.messageId, {
      deletedAt: Date.now(),
    })

    return args.messageId
  },
})

// Add reaction to a message
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error("Message not found")
    }

    // Check if user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", message.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const reactions = message.reactions || []

    // Check if user already reacted with this emoji
    const existingReaction = reactions.find(
      (r) => r.emoji === args.emoji && r.userId === userId
    )

    if (existingReaction) {
      // Remove reaction if already exists
      const updatedReactions = reactions.filter(
        (r) => !(r.emoji === args.emoji && r.userId === userId)
      )
      await ctx.db.patch(args.messageId, {
        reactions: updatedReactions,
      })
    } else {
      // Add new reaction
      await ctx.db.patch(args.messageId, {
        reactions: [...reactions, { emoji: args.emoji, userId }],
      })
    }

    return args.messageId
  },
})

// Search messages
export const search = query({
  args: {
    projectId: v.id("projects"),
    query: v.string(),
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

    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()

    // Simple search by content
    const searchQuery = args.query.toLowerCase()
    const matchedMessages = allMessages.filter((message) =>
      message.content.toLowerCase().includes(searchQuery)
    )

    // Get author details for each message
    const messagesWithAuthors = await Promise.all(
      matchedMessages.map(async (message) => {
        const author = await ctx.db.get(message.authorId)
        return {
          ...message,
          author: author
            ? {
                _id: author._id,
                name: author.name ?? null,
                email: author.email ?? "",
                image: author.image,
              }
            : null,
        }
      })
    )

    return messagesWithAuthors
  },
})

// Get unread message count for a project
export const getUnreadCount = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return 0
    }

    // Check if user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      return 0
    }

    // Get last read timestamp
    const readStatus = await ctx.db
      .query("messageReadStatus")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .first()

    const lastReadAt = readStatus?.lastReadAt ?? 0

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .filter((q) => q.gt(q.field("createdAt"), lastReadAt))
      .filter((q) => q.neq(q.field("authorId"), userId)) // Exclude own messages
      .collect()

    return messages.length
  },
})

// Mark messages as read for a project
export const markAsRead = mutation({
  args: {
    projectId: v.id("projects"),
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

    const now = Date.now()

    // Check if read status exists
    const existingStatus = await ctx.db
      .query("messageReadStatus")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .first()

    if (existingStatus) {
      // Update existing
      await ctx.db.patch(existingStatus._id, {
        lastReadAt: now,
      })
    } else {
      // Create new
      await ctx.db.insert("messageReadStatus", {
        userId,
        projectId: args.projectId,
        lastReadAt: now,
      })
    }

    return { success: true }
  },
})
