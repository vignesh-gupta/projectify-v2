import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

/**
 * Create a new comment on a task
 */
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    threadId: v.optional(v.id("taskComments")),
    mentions: v.optional(v.array(v.id("users"))),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          type: v.string(),
          size: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Get the task to verify access
    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", task.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const now = Date.now()

    // Create the comment
    const commentId = await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      authorId: userId,
      content: args.content,
      threadId: args.threadId,
      mentions: args.mentions,
      attachments: args.attachments,
      reactions: {},
      createdAt: now,
    })

    // Create notifications for mentions
    if (args.mentions && args.mentions.length > 0) {
      for (const mentionedUserId of args.mentions) {
        // Don't notify the author
        if (mentionedUserId === userId) continue

        await ctx.db.insert("notifications", {
          userId: mentionedUserId,
          type: "comment_mention",
          title: "You were mentioned in a comment",
          message: `on task "${task.title}"`,
          taskId: args.taskId,
          commentId,
          projectId: task.projectId,
          triggeredBy: userId,
          isRead: false,
          createdAt: now,
        })
      }
    }

    // Notify the task assignee if not the commenter
    if (task.assigneeUserId && task.assigneeUserId !== userId) {
      await ctx.db.insert("notifications", {
        userId: task.assigneeUserId,
        type: "task_comment",
        title: "New comment on your task",
        message: `"${task.title}"`,
        taskId: args.taskId,
        commentId,
        projectId: task.projectId,
        triggeredBy: userId,
        isRead: false,
        createdAt: now,
      })
    }

    // If this is a reply, notify the parent comment author
    if (args.threadId) {
      const parentComment = await ctx.db.get(args.threadId)
      if (parentComment && parentComment.authorId !== userId) {
        await ctx.db.insert("notifications", {
          userId: parentComment.authorId,
          type: "comment_reply",
          title: "Someone replied to your comment",
          message: `on task "${task.title}"`,
          taskId: args.taskId,
          commentId,
          projectId: task.projectId,
          triggeredBy: userId,
          isRead: false,
          createdAt: now,
        })
      }
    }

    return commentId
  },
})

/**
 * List all comments for a task (with replies nested)
 */
export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Get the task to verify access
    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", task.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    // Get all comments for the task
    const allComments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()

    // Separate top-level comments and replies
    const topLevelComments = allComments.filter((c) => !c.threadId)
    const replies = allComments.filter((c) => c.threadId)

    // Get author information for all comments
    const authorIds = [...new Set(allComments.map((c) => c.authorId))]
    const authors = await Promise.all(
      authorIds.map(async (id) => {
        const user = await ctx.db.get(id)
        return user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              image: user.image,
            }
          : null
      })
    )

    const authorMap = new Map(
      authors.filter((a) => a !== null).map((a) => [a!._id, a])
    )

    // Build nested comment structure
    const commentsWithReplies = topLevelComments.map((comment) => {
      const commentReplies = replies
        .filter((r) => r.threadId === comment._id)
        .map((reply) => ({
          ...reply,
          author: authorMap.get(reply.authorId) || null,
        }))
        .sort((a, b) => a.createdAt - b.createdAt)

      return {
        ...comment,
        author: authorMap.get(comment.authorId) || null,
        replies: commentReplies,
      }
    })

    // Sort by newest first
    return commentsWithReplies.sort((a, b) => b.createdAt - a.createdAt)
  },
})

/**
 * Update a comment
 */
export const update = mutation({
  args: {
    commentId: v.id("taskComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const comment = await ctx.db.get(args.commentId)
    if (!comment) {
      throw new Error("Comment not found")
    }

    // Only the author can edit
    if (comment.authorId !== userId) {
      throw new Error("Not authorized to edit this comment")
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    })
  },
})

/**
 * Soft delete a comment
 */
export const remove = mutation({
  args: {
    commentId: v.id("taskComments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const comment = await ctx.db.get(args.commentId)
    if (!comment) {
      throw new Error("Comment not found")
    }

    // Get the task to check permissions
    const task = await ctx.db.get(comment.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    // Check if user is the author or admin/owner
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", task.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const canDelete =
      comment.authorId === userId ||
      membership.role === "admin" ||
      membership.role === "owner"

    if (!canDelete) {
      throw new Error("Not authorized to delete this comment")
    }

    // Soft delete
    await ctx.db.patch(args.commentId, {
      deletedAt: Date.now(),
    })
  },
})

/**
 * Toggle reaction on a comment
 */
export const toggleReaction = mutation({
  args: {
    commentId: v.id("taskComments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const comment = await ctx.db.get(args.commentId)
    if (!comment) {
      throw new Error("Comment not found")
    }

    // Get the task to verify access
    const task = await ctx.db.get(comment.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", task.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    const reactions: Record<string, string[]> = (comment.reactions || {}) as Record<string, string[]>
    const emojiReactions = reactions[args.emoji] || []

    // Toggle: add or remove user's reaction
    const userReacted = emojiReactions.includes(userId)
    const updatedReactions = userReacted
      ? emojiReactions.filter((id) => id !== userId)
      : [...emojiReactions, userId]

    // Update or remove the emoji key
    const newReactions = { ...reactions }
    if (updatedReactions.length === 0) {
      delete newReactions[args.emoji]
    } else {
      newReactions[args.emoji] = updatedReactions
    }

    await ctx.db.patch(args.commentId, { reactions: newReactions })
  },
})

/**
 * List replies for a specific comment thread
 */
export const listByThread = query({
  args: {
    threadId: v.id("taskComments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Get the parent comment
    const parentComment = await ctx.db.get(args.threadId)
    if (!parentComment) {
      throw new Error("Comment not found")
    }

    // Get the task to verify access
    const task = await ctx.db.get(parentComment.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    // Verify user is a member of the project
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", task.projectId).eq("userId", userId)
      )
      .first()

    if (!membership) {
      throw new Error("Not a member of this project")
    }

    // Get all replies
    const replies = await ctx.db
      .query("taskComments")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()

    // Get author information
    const authorIds = [...new Set(replies.map((r) => r.authorId))]
    const authors = await Promise.all(
      authorIds.map(async (id) => {
        const user = await ctx.db.get(id)
        return user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              image: user.image,
            }
          : null
      })
    )

    const authorMap = new Map(
      authors.filter((a) => a !== null).map((a) => [a!._id, a])
    )

    // Attach author info and sort
    return replies
      .map((reply) => ({
        ...reply,
        author: authorMap.get(reply.authorId) || null,
      }))
      .sort((a, b) => a.createdAt - b.createdAt)
  },
})
