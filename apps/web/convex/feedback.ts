import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server"
import { Id } from "./_generated/dataModel"

const feedbackStatusValidator = v.union(
  v.literal("new"),
  v.literal("under_review"),
  v.literal("planned"),
  v.literal("in_progress"),
  v.literal("done"),
  v.literal("rejected")
)

const feedbackCategoryValidator = v.union(
  v.literal("bug"),
  v.literal("feature"),
  v.literal("improvement")
)

async function requireProjectMembership(
  ctx: MutationCtx | QueryCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
) {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId)
    )
    .first()

  if (!membership) {
    throw new Error("Not a member of this project")
  }

  return membership
}

async function getFeedbackWithMembershipCheck(
  ctx: MutationCtx,
  feedbackId: Id<"feedback">,
  userId: Id<"users">
) {
  const feedback = await ctx.db.get(feedbackId)
  if (!feedback) {
    throw new Error("Feedback not found")
  }

  const membership = await requireProjectMembership(
    ctx,
    feedback.projectId,
    userId
  )

  return { feedback, membership }
}

async function attachAuthorDataToFeedbackList<
  T extends {
    createdBy: Id<"users">
  },
>(ctx: QueryCtx, feedbackItems: T[]) {
  return await Promise.all(
    feedbackItems.map(async (feedback) => {
      const author = await ctx.db.get(feedback.createdBy)
      return {
        ...feedback,
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
}

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    category: feedbackCategoryValidator,
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    await requireProjectMembership(ctx, args.projectId, userId)

    const normalizedTitle = args.title.trim()
    const normalizedDescription = args.description.trim()

    if (!normalizedTitle) {
      throw new Error("Title is required")
    }
    if (!normalizedDescription) {
      throw new Error("Description is required")
    }

    const now = Date.now()
    return await ctx.db.insert("feedback", {
      projectId: args.projectId,
      title: normalizedTitle,
      description: normalizedDescription,
      category: args.category,
      status: "new",
      votes: 0,
      isPublic: args.isPublic,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(feedbackStatusValidator),
    category: v.optional(feedbackCategoryValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    await requireProjectMembership(ctx, args.projectId, userId)

    let feedbackList = args.status
      ? await ctx.db
          .query("feedback")
          .withIndex("by_project_status", (q) =>
            q.eq("projectId", args.projectId).eq("status", args.status!)
          )
          .collect()
      : await ctx.db
          .query("feedback")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()

    if (args.category) {
      feedbackList = feedbackList.filter(
        (item) => item.category === args.category
      )
    }

    const votesByUser = await ctx.db
      .query("feedbackVotes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
    const votedSet = new Set(votesByUser.map((vote) => vote.feedbackId))

    const withAuthors = await attachAuthorDataToFeedbackList(ctx, feedbackList)
    return withAuthors
      .map((item) => ({
        ...item,
        hasVoted: votedSet.has(item._id),
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listPublicByProject = query({
  args: {
    projectId: v.id("projects"),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const feedbackList = await ctx.db
      .query("feedback")
      .withIndex("by_project_public", (q) =>
        q.eq("projectId", args.projectId).eq("isPublic", true)
      )
      .collect()

    const anonymousVotes =
      args.anonymousId && args.anonymousId.trim().length > 0
        ? await ctx.db
            .query("feedbackVotes")
            .withIndex("by_anonymous", (q) =>
              q.eq("anonymousId", args.anonymousId)
            )
            .collect()
        : []

    const votedSet = new Set(anonymousVotes.map((vote) => vote.feedbackId))
    const withAuthors = await attachAuthorDataToFeedbackList(ctx, feedbackList)

    return withAuthors
      .map((item) => ({
        ...item,
        hasVoted: votedSet.has(item._id),
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const update = mutation({
  args: {
    feedbackId: v.id("feedback"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(feedbackCategoryValidator),
    status: v.optional(feedbackStatusValidator),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { feedback, membership } = await getFeedbackWithMembershipCheck(
      ctx,
      args.feedbackId,
      userId
    )

    const { feedbackId, ...updates } = args
    const isOwner = feedback.createdBy === userId
    const isAdminOrOwnerRole =
      membership.role === "owner" || membership.role === "admin"

    if (!isOwner && !isAdminOrOwnerRole) {
      throw new Error("Insufficient permissions")
    }

    if (args.status !== undefined && !isAdminOrOwnerRole) {
      throw new Error("Only admins or owners can update status")
    }

    await ctx.db.patch(feedbackId, {
      ...updates,
      updatedAt: Date.now(),
    })

    return feedbackId
  },
})

export const toggleVote = mutation({
  args: {
    feedbackId: v.id("feedback"),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId)
    if (!feedback) {
      throw new Error("Feedback not found")
    }

    const authUserId = await getAuthUserId(ctx)
    const normalizedAnonymousId = args.anonymousId?.trim()

    if (authUserId) {
      await requireProjectMembership(ctx, feedback.projectId, authUserId)

      const existingVote = await ctx.db
        .query("feedbackVotes")
        .withIndex("by_feedback_user", (q) =>
          q.eq("feedbackId", args.feedbackId).eq("userId", authUserId)
        )
        .first()

      if (existingVote) {
        await ctx.db.delete(existingVote._id)
      } else {
        await ctx.db.insert("feedbackVotes", {
          feedbackId: args.feedbackId,
          userId: authUserId,
          anonymousId: undefined,
          createdAt: Date.now(),
        })
      }
    } else {
      if (!feedback.isPublic) {
        throw new Error("Only public feedback can be voted anonymously")
      }

      if (!normalizedAnonymousId) {
        throw new Error("Anonymous vote id is required")
      }

      const existingVote = await ctx.db
        .query("feedbackVotes")
        .withIndex("by_feedback_anonymous", (q) =>
          q
            .eq("feedbackId", args.feedbackId)
            .eq("anonymousId", normalizedAnonymousId)
        )
        .first()

      if (existingVote) {
        await ctx.db.delete(existingVote._id)
      } else {
        await ctx.db.insert("feedbackVotes", {
          feedbackId: args.feedbackId,
          userId: undefined,
          anonymousId: normalizedAnonymousId,
          createdAt: Date.now(),
        })
      }
    }

    const votes = await ctx.db
      .query("feedbackVotes")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect()

    await ctx.db.patch(args.feedbackId, {
      votes: votes.length,
      updatedAt: Date.now(),
    })

    return {
      feedbackId: args.feedbackId,
      votes: votes.length,
    }
  },
})

export const convertToTask = mutation({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const { feedback, membership } = await getFeedbackWithMembershipCheck(
      ctx,
      args.feedbackId,
      userId
    )

    if (membership.role === "member") {
      throw new Error("Only admins or owners can convert feedback to task")
    }

    const now = Date.now()
    const taskId = await ctx.db.insert("tasks", {
      projectId: feedback.projectId,
      title: feedback.title,
      description: feedback.description,
      status: "todo",
      priority:
        feedback.category === "bug"
          ? "high"
          : feedback.category === "improvement"
            ? "medium"
            : "low",
      dueDate: undefined,
      assigneeUserId: undefined,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    })

    await ctx.db.patch(args.feedbackId, {
      status: "planned",
      updatedAt: now,
    })

    return {
      taskId,
      feedbackId: args.feedbackId,
    }
  },
})

export const listComments = query({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const feedback = await ctx.db.get(args.feedbackId)
    if (!feedback) {
      throw new Error("Feedback not found")
    }

    await requireProjectMembership(ctx, feedback.projectId, userId)

    const comments = await ctx.db
      .query("feedbackComments")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect()

    return await Promise.all(
      comments
        .sort((a, b) => a.createdAt - b.createdAt)
        .map(async (comment) => {
          const author = await ctx.db.get(comment.authorId)
          return {
            ...comment,
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
  },
})

export const addComment = mutation({
  args: {
    feedbackId: v.id("feedback"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const feedback = await ctx.db.get(args.feedbackId)
    if (!feedback) {
      throw new Error("Feedback not found")
    }

    await requireProjectMembership(ctx, feedback.projectId, userId)

    const normalizedContent = args.content.trim()
    if (!normalizedContent) {
      throw new Error("Comment content is required")
    }

    const now = Date.now()
    return await ctx.db.insert("feedbackComments", {
      feedbackId: args.feedbackId,
      authorId: userId,
      content: normalizedContent,
      createdAt: now,
    })
  },
})
