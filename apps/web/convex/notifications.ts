import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"

const notificationArgs = {
  userId: v.id("users"),
  type: v.union(
    v.literal("task_assigned"),
    v.literal("task_unassigned"),
    v.literal("task_status_changed"),
    v.literal("task_due_soon"),
    v.literal("message_mentioned")
  ),
  taskId: v.optional(v.id("tasks")),
  messageId: v.optional(v.id("messages")),
  projectId: v.id("projects"),
  triggeredBy: v.id("users"),
  metadata: v.optional(
    v.object({
      taskTitle: v.optional(v.string()),
      oldStatus: v.optional(v.string()),
      newStatus: v.optional(v.string()),
      messagePreview: v.optional(v.string()),
    })
  ),
}

export const createInternal = internalMutation({
  args: notificationArgs,
  handler: async (ctx, args) => {
    if (args.userId === args.triggeredBy) {
      return null
    }

    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      taskId: args.taskId,
      messageId: args.messageId,
      projectId: args.projectId,
      triggeredBy: args.triggeredBy,
      isRead: false,
      metadata: args.metadata,
      createdAt: Date.now(),
    })
  },
})

/**
 * List notifications for the current user
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const limit = args.limit ?? 50

    let notifications
    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) =>
          q.eq("userId", userId).eq("isRead", false)
        )
        .order("desc")
        .take(limit)
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit)
    }

    // Enrich with user and task details
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const triggeredByUser = await ctx.db.get(notification.triggeredBy)
        const task = notification.taskId
          ? await ctx.db.get(notification.taskId)
          : null
        const message = notification.messageId
          ? await ctx.db.get(notification.messageId)
          : null
        const project = await ctx.db.get(notification.projectId)

        return {
          ...notification,
          triggeredByUser: triggeredByUser
            ? {
                _id: triggeredByUser._id,
                name: triggeredByUser.name ?? null,
                email: triggeredByUser.email ?? "",
                image: triggeredByUser.image,
              }
            : null,
          task: task
            ? {
                _id: task._id,
                title: task.title,
                status: task.status,
              }
            : null,
          message: message
            ? {
                _id: message._id,
                content: message.content,
                threadId: message.threadId,
              }
            : null,
          project: project
            ? {
                _id: project._id,
                title: project.title,
              }
            : null,
        }
      })
    )

    return enrichedNotifications
  },
})

/**
 * Get unread notification count for current user
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return 0
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect()

    return unreadNotifications.length
  },
})

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }

    if (notification.userId !== userId) {
      throw new Error("Not authorized to mark this notification as read")
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    })

    return args.notificationId
  },
})

/**
 * Mark all notifications as read for current user
 */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect()

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true })
      )
    )

    return { count: unreadNotifications.length }
  },
})

/**
 * Delete old read notifications (cleanup)
 */
export const deleteOldRead = mutation({
  args: {
    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const daysAgo = args.olderThanDays ?? 30
    const cutoffTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000

    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isRead"), true),
          q.lt(q.field("createdAt"), cutoffTime)
        )
      )
      .collect()

    await Promise.all(
      oldNotifications.map((notification) => ctx.db.delete(notification._id))
    )

    return { count: oldNotifications.length }
  },
})
