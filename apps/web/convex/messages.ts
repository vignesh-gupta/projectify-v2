import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Send a new message
export const send = mutation({
  args: {
    projectId: v.id("projects"),
    content: v.string(),
    threadId: v.optional(v.id("messages")),
    attachments: v.optional(v.array(v.id("_storage"))),
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
    lastReadAt: v.number(),
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
      .filter((q) => q.gt(q.field("createdAt"), args.lastReadAt))
      .filter((q) => q.neq(q.field("authorId"), userId)) // Exclude own messages
      .collect()

    return messages.length
  },
})
