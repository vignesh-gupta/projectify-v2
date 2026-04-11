import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Doc, Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"
import { authenticateApiKey, requireProjectMembership, requireScope } from "./lib/apiKeyAuth"

const MENTION_PATTERN = /@(\w+(?:\s+\w+)?)/g

type MentionableMember = Pick<Doc<"users">, "_id" | "name" | "email">

function extractMentionedUserIds(
  members: MentionableMember[],
  content: string
) {
  const normalizedMembers = members.map((member) => ({
    userId: member._id,
    name: member.name?.trim().toLowerCase(),
    email: member.email?.trim().toLowerCase() ?? "",
  }))

  const mentionedUserIds = new Set<Id<"users">>()

  for (const match of content.matchAll(MENTION_PATTERN)) {
    const rawMention = match[1]?.trim().toLowerCase()
    if (!rawMention) {
      continue
    }

    const matchedMember = normalizedMembers.find(
      (member) => member.name === rawMention || member.email === rawMention
    )

    if (matchedMember) {
      mentionedUserIds.add(matchedMember.userId)
    }
  }

  return [...mentionedUserIds]
}

function getMessagePreview(content: string) {
  return content.trim().slice(0, 120)
}

async function getMentionableMembers(
  ctx: MutationCtx,
  projectId: Id<"projects">
): Promise<MentionableMember[]> {
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect()

  const members = await Promise.all(
    memberships.map(async (membership) => await ctx.db.get(membership.userId))
  )

  return members.filter((member): member is Doc<"users"> => member !== null)
}

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

    const mentionableMembers = await getMentionableMembers(ctx, args.projectId)
    const mentionedUserIds = extractMentionedUserIds(
      mentionableMembers,
      args.content
    )

    await Promise.all(
      mentionedUserIds
        .filter((mentionedUserId) => mentionedUserId !== userId)
        .map((mentionedUserId) =>
          ctx.scheduler.runAfter(0, internal.notifications.createInternal, {
            userId: mentionedUserId,
            type: "message_mentioned",
            messageId,
            projectId: args.projectId,
            triggeredBy: userId,
            metadata: {
              messagePreview: getMessagePreview(args.content),
            },
          })
        )
    )

    return messageId
  },
})

// List messages for a project
export const list = query({
  args: {
    projectId: v.id("projects"),
    paginationOpts: paginationOptsValidator,
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
    // Order messages by creation time descending, and paginate
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .filter((q) => q.eq(q.field("threadId"), undefined)) // Only root messages
      .order("desc")
      .paginate(args.paginationOpts)

    // Get author details for each message
    const messagesWithAuthors = await Promise.all(
      messages.page.map(async (message) => {
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

    return {
      ...messages,
      page: messagesWithAuthors,
    }
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

    const mentionableMembers = await getMentionableMembers(
      ctx,
      message.projectId
    )
    const existingMentionedUserIds = extractMentionedUserIds(
      mentionableMembers,
      message.content
    )
    const nextMentionedUserIds = extractMentionedUserIds(
      mentionableMembers,
      args.content
    )

    await ctx.db.patch(args.messageId, {
      content: args.content,
      updatedAt: Date.now(),
    })

    const existingMentionedUserIdSet = new Set(existingMentionedUserIds)

    await Promise.all(
      nextMentionedUserIds
        .filter(
          (mentionedUserId) =>
            mentionedUserId !== userId &&
            !existingMentionedUserIdSet.has(mentionedUserId)
        )
        .map((mentionedUserId) =>
          ctx.scheduler.runAfter(0, internal.notifications.createInternal, {
            userId: mentionedUserId,
            type: "message_mentioned",
            messageId: args.messageId,
            projectId: message.projectId,
            triggeredBy: userId,
            metadata: {
              messagePreview: getMessagePreview(args.content),
            },
          })
        )
    )

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

export const listByApiKey = query({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:read")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .filter((q) => q.eq(q.field("threadId"), undefined))
      .collect()

    const sorted = messages.sort((a, b) => b.createdAt - a.createdAt)
    const offset = Math.max(0, args.offset ?? 0)
    const limit = Math.max(1, Math.min(1000, args.limit ?? 20))
    const paginated = sorted.slice(offset, offset + limit)

    const enriched = await Promise.all(
      paginated.map(async (message) => {
        const author = await ctx.db.get(message.authorId)
        return {
          id: message._id,
          projectId: message.projectId,
          authorId: message.authorId,
          content: message.content,
          threadId: message.threadId,
          attachments: message.attachments,
          reactions: message.reactions,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
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

    return {
      messages: enriched,
      total: sorted.length,
    }
  },
})

export const sendByApiKey = mutation({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    content: v.string(),
    threadId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "projects:write")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

    const content = args.content.trim()
    if (!content) {
      throw new Error("Message content is required")
    }

    if (args.threadId) {
      const parent = await ctx.db.get(args.threadId)
      if (!parent) {
        throw new Error("Parent message not found")
      }
      if (parent.projectId !== args.projectId) {
        throw new Error("Parent message belongs to different project")
      }
    }

    const messageId = await ctx.db.insert("messages", {
      projectId: args.projectId,
      authorId: auth.userId,
      content,
      threadId: args.threadId,
      attachments: undefined,
      reactions: [],
      createdAt: Date.now(),
    })

    const message = await ctx.db.get(messageId)
    if (!message) {
      throw new Error("Failed to send message")
    }

    return {
      message: {
        id: message._id,
        projectId: message.projectId,
        authorId: message.authorId,
        content: message.content,
        threadId: message.threadId,
        attachments: message.attachments,
        reactions: message.reactions,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    }
  },
})
