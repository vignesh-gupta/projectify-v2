import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import {
  authenticateApiKey as authenticateUserApiKey,
  requireScope,
} from "./lib/apiKeyAuth"

const semverPattern = /^\d+\.\d+\.\d+$/

function normalizeHtmlContent(content: string) {
  return content.trim()
}

function assertSemver(version: string) {
  if (!semverPattern.test(version)) {
    throw new Error("Version must use semver format like 1.2.3")
  }
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")
}

function generateSecret(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`
}

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

async function requireProjectAdmin(
  ctx: MutationCtx | QueryCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
) {
  const membership = await requireProjectMembership(ctx, projectId, userId)
  if (membership.role === "member") {
    throw new Error("Only owners and admins can manage changelog settings")
  }
  return membership
}

async function enrichAuthor<
  T extends {
    createdBy: Id<"users">
  },
>(ctx: QueryCtx | MutationCtx, item: T) {
  const author = await ctx.db.get(item.createdBy)
  return {
    ...item,
    author: author
      ? {
          _id: author._id,
          name: author.name ?? null,
          email: author.email ?? "",
          image: author.image,
        }
      : null,
  }
}

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const membership = await requireProjectMembership(
      ctx,
      args.projectId,
      userId
    )
    const project = await ctx.db.get(args.projectId)

    const entries = await ctx.db
      .query("changelog")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    const enriched = await Promise.all(
      entries
        .sort((a, b) => {
          const left = a.publishedAt ?? a.updatedAt
          const right = b.publishedAt ?? b.updatedAt
          return right - left
        })
        .map((entry) => enrichAuthor(ctx, entry))
    )

    return {
      project,
      role: membership.role,
      entries: enriched,
    }
  },
})

export const get = query({
  args: {
    changelogId: v.id("changelog"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const entry = await ctx.db.get(args.changelogId)
    if (!entry) {
      throw new Error("Changelog entry not found")
    }

    await requireProjectMembership(ctx, entry.projectId, userId)
    return await enrichAuthor(ctx, entry)
  },
})

export const createDraft = mutation({
  args: {
    projectId: v.id("projects"),
    version: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    await requireProjectAdmin(ctx, args.projectId, userId)

    const version = args.version.trim()
    const title = args.title.trim()
    const content = normalizeHtmlContent(args.content)

    assertSemver(version)
    if (!title) {
      throw new Error("Title is required")
    }
    if (!content) {
      throw new Error("Content is required")
    }

    const existingPublished = await ctx.db
      .query("changelog")
      .withIndex("by_project_version", (q) =>
        q.eq("projectId", args.projectId).eq("version", version)
      )
      .filter((q) => q.eq(q.field("status"), "published"))
      .first()

    if (existingPublished) {
      throw new Error("This version has already been published")
    }

    const now = Date.now()
    return await ctx.db.insert("changelog", {
      projectId: args.projectId,
      version,
      title,
      content,
      status: "draft",
      publishedAt: undefined,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateDraft = mutation({
  args: {
    changelogId: v.id("changelog"),
    version: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const entry = await ctx.db.get(args.changelogId)
    if (!entry) {
      throw new Error("Changelog entry not found")
    }
    if (entry.status !== "draft") {
      throw new Error("Only draft entries can be edited")
    }

    await requireProjectAdmin(ctx, entry.projectId, userId)

    const version = args.version.trim()
    const title = args.title.trim()
    const content = normalizeHtmlContent(args.content)

    assertSemver(version)
    if (!title) {
      throw new Error("Title is required")
    }
    if (!content) {
      throw new Error("Content is required")
    }

    const conflictingPublished = await ctx.db
      .query("changelog")
      .withIndex("by_project_version", (q) =>
        q.eq("projectId", entry.projectId).eq("version", version)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
          q.neq(q.field("_id"), args.changelogId)
        )
      )
      .first()

    if (conflictingPublished) {
      throw new Error("This version has already been published")
    }

    await ctx.db.patch(args.changelogId, {
      version,
      title,
      content,
      updatedAt: Date.now(),
    })

    return args.changelogId
  },
})

export const publish = mutation({
  args: {
    changelogId: v.id("changelog"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const entry = await ctx.db.get(args.changelogId)
    if (!entry) {
      throw new Error("Changelog entry not found")
    }
    if (entry.status !== "draft") {
      throw new Error("Only draft entries can be published")
    }

    await requireProjectAdmin(ctx, entry.projectId, userId)
    assertSemver(entry.version)

    const conflictingPublished = await ctx.db
      .query("changelog")
      .withIndex("by_project_version", (q) =>
        q.eq("projectId", entry.projectId).eq("version", entry.version)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
          q.neq(q.field("_id"), args.changelogId)
        )
      )
      .first()

    if (conflictingPublished) {
      throw new Error("This version has already been published")
    }

    const publishedAt = Date.now()
    await ctx.db.patch(args.changelogId, {
      status: "published",
      publishedAt,
      updatedAt: publishedAt,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.changelogWebhook.deliverPublishedWebhook,
      {
        changelogId: args.changelogId,
      }
    )

    return args.changelogId
  },
})

export const listPublishedByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId)
    if (!project) {
      throw new Error("Project not found")
    }

    const entries = await ctx.db
      .query("changelog")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "published")
      )
      .collect()

    return {
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
      },
      entries: entries
        .filter((entry) => entry.publishedAt)
        .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0)),
    }
  },
})

export const getPublishedEntry = query({
  args: {
    projectId: v.id("projects"),
    changelogId: v.id("changelog"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.changelogId)
    if (
      !entry ||
      entry.projectId !== args.projectId ||
      entry.status !== "published"
    ) {
      throw new Error("Published changelog entry not found")
    }

    const project = await ctx.db.get(args.projectId)
    return {
      project: project
        ? {
            _id: project._id,
            title: project.title,
          }
        : null,
      entry,
    }
  },
})

export const listApiKeys = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const membership = await requireProjectMembership(
      ctx,
      args.projectId,
      userId
    )
    if (membership.role === "member") {
      return []
    }

    return await ctx.db
      .query("apiKeys")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
      .then((items) => items.sort((a, b) => b.createdAt - a.createdAt))
  },
})

export const createApiKey = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    await requireProjectAdmin(ctx, args.projectId, userId)

    const name = args.name.trim()
    if (!name) {
      throw new Error("API key name is required")
    }

    const rawKey = generateSecret("pk")
    const keyHash = await sha256(rawKey)
    const now = Date.now()

    const apiKeyId = await ctx.db.insert("apiKeys", {
      projectId: args.projectId,
      name,
      keyHash,
      keyPreview: `${rawKey.slice(0, 7)}...${rawKey.slice(-4)}`,
      scopes: ["read:changelog"],
      status: "active",
      createdBy: userId,
      lastUsedAt: undefined,
      revokedAt: undefined,
      createdAt: now,
      updatedAt: now,
    })

    return {
      apiKeyId,
      apiKey: rawKey,
      keyPreview: `${rawKey.slice(0, 7)}...${rawKey.slice(-4)}`,
    }
  },
})

export const revokeApiKey = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const apiKey = await ctx.db.get(args.apiKeyId)
    if (!apiKey) {
      throw new Error("API key not found")
    }

    await requireProjectAdmin(ctx, apiKey.projectId, userId)

    const now = Date.now()
    await ctx.db.patch(args.apiKeyId, {
      status: "revoked",
      revokedAt: now,
      updatedAt: now,
    })

    return args.apiKeyId
  },
})

export const listWebhooks = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const membership = await requireProjectMembership(
      ctx,
      args.projectId,
      userId
    )
    if (membership.role === "member") {
      return []
    }

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    return webhooks.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const createWebhook = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    await requireProjectAdmin(ctx, args.projectId, userId)

    const name = args.name.trim()
    const url = args.url.trim()

    if (!name) {
      throw new Error("Webhook name is required")
    }

    try {
      const parsed = new URL(url)
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Webhook URL must be http or https")
      }
    } catch {
      throw new Error("Webhook URL must be valid")
    }

    const signingSecret = generateSecret("whsec")
    const now = Date.now()
    const webhookId = await ctx.db.insert("webhooks", {
      projectId: args.projectId,
      name,
      url,
      event: "changelog.published",
      signingSecret,
      secretPreview: `${signingSecret.slice(0, 9)}...${signingSecret.slice(-4)}`,
      status: "active",
      lastDeliveredAt: undefined,
      lastDeliveryStatus: undefined,
      createdBy: userId,
      disabledAt: undefined,
      createdAt: now,
      updatedAt: now,
    })

    return {
      webhookId,
      signingSecret,
      secretPreview: `${signingSecret.slice(0, 9)}...${signingSecret.slice(-4)}`,
    }
  },
})

export const disableWebhook = mutation({
  args: {
    webhookId: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const webhook = await ctx.db.get(args.webhookId)
    if (!webhook) {
      throw new Error("Webhook not found")
    }

    await requireProjectAdmin(ctx, webhook.projectId, userId)
    const now = Date.now()
    await ctx.db.patch(args.webhookId, {
      status: "disabled",
      disabledAt: now,
      updatedAt: now,
    })

    return args.webhookId
  },
})

export const listWebhookDeliveries = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const membership = await requireProjectMembership(
      ctx,
      args.projectId,
      userId
    )
    if (membership.role === "member") {
      return []
    }

    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    return deliveries.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20)
  },
})

export const authenticateApiKey = action({
  args: {
    projectId: v.id("projects"),
    apiKey: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    apiKeyId: Id<"apiKeys">
    projectId: Id<"projects">
    scopes: Array<"read:changelog">
    keyPreview: string
  } | null> => {
    const normalizedKey = args.apiKey.trim()
    if (!normalizedKey) {
      return null
    }

    const keyHash = await sha256(normalizedKey)
    const apiKeys = (await ctx.runQuery(
      internal.changelog.getActiveApiKeysForProject,
      {
        projectId: args.projectId,
      }
    )) as Doc<"apiKeys">[]

    const matchedKey = apiKeys.find(
      (item: Doc<"apiKeys">) => item.keyHash === keyHash
    )
    if (!matchedKey) {
      return null
    }

    await ctx.runMutation(internal.changelog.markApiKeyUsed, {
      apiKeyId: matchedKey._id,
    })

    return {
      apiKeyId: matchedKey._id,
      projectId: matchedKey.projectId,
      scopes: matchedKey.scopes,
      keyPreview: matchedKey.keyPreview,
    }
  },
})

export const getActiveApiKeysForProject = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "active")
      )
      .collect()
  },
})

export const markApiKeyUsed = internalMutation({
  args: {
    apiKeyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.apiKeyId, {
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const getPublishedWebhookPayload = internalQuery({
  args: {
    changelogId: v.id("changelog"),
  },
  handler: async (ctx, args) => {
    const changelog = await ctx.db.get(args.changelogId)
    if (!changelog || changelog.status !== "published") {
      return null
    }

    const project = await ctx.db.get(changelog.projectId)
    if (!project) {
      return null
    }

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", changelog.projectId).eq("status", "active")
      )
      .collect()

    return {
      project: {
        _id: project._id,
        title: project.title,
      },
      changelog,
      webhooks,
    }
  },
})

export const recordWebhookDelivery = internalMutation({
  args: {
    webhookId: v.id("webhooks"),
    projectId: v.id("projects"),
    changelogId: v.id("changelog"),
    requestUrl: v.string(),
    requestBody: v.string(),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.insert("webhookDeliveries", {
      webhookId: args.webhookId,
      projectId: args.projectId,
      event: "changelog.published",
      changelogId: args.changelogId,
      requestUrl: args.requestUrl,
      requestBody: args.requestBody,
      responseStatus: args.responseStatus,
      responseBody: args.responseBody,
      status: args.status,
      errorMessage: args.errorMessage,
      deliveredAt: now,
      createdAt: now,
    })

    await ctx.db.patch(args.webhookId, {
      lastDeliveredAt: now,
      lastDeliveryStatus: args.status,
      updatedAt: now,
    })
  },
})

export const listByApiKey = query({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateUserApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "changelog:read")
    await requireProjectMembership(ctx, args.projectId, auth.userId)

    const entries = await ctx.db
      .query("changelog")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    const filtered = args.status
      ? entries.filter((entry) => entry.status === args.status)
      : entries

    const sorted = filtered.sort((a, b) => {
      const left = a.publishedAt ?? a.updatedAt
      const right = b.publishedAt ?? b.updatedAt
      return right - left
    })

    const offset = Math.max(0, args.offset ?? 0)
    const limit = Math.max(1, Math.min(1000, args.limit ?? 50))
    const paginated = sorted.slice(offset, offset + limit)

    const serialized = await Promise.all(
      paginated.map(async (entry) => {
        const enriched = await enrichAuthor(ctx, entry)
        return {
          id: enriched._id,
          projectId: enriched.projectId,
          version: enriched.version,
          title: enriched.title,
          content: enriched.content,
          status: enriched.status,
          publishedAt: enriched.publishedAt,
          createdAt: enriched.createdAt,
          updatedAt: enriched.updatedAt,
          author: enriched.author,
        }
      })
    )

    return { entries: serialized, total: sorted.length }
  },
})

export const createDraftByApiKey = mutation({
  args: {
    apiKey: v.string(),
    projectId: v.id("projects"),
    version: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateUserApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "changelog:write")
    await requireProjectAdmin(ctx, args.projectId, auth.userId)

    const version = args.version.trim()
    const title = args.title.trim()
    const content = normalizeHtmlContent(args.content)

    assertSemver(version)
    if (!title) {
      throw new Error("Title is required")
    }
    if (!content) {
      throw new Error("Content is required")
    }

    const existingPublished = await ctx.db
      .query("changelog")
      .withIndex("by_project_version", (q) =>
        q.eq("projectId", args.projectId).eq("version", version)
      )
      .filter((q) => q.eq(q.field("status"), "published"))
      .first()

    if (existingPublished) {
      throw new Error("This version has already been published")
    }

    const now = Date.now()
    const changelogId = await ctx.db.insert("changelog", {
      projectId: args.projectId,
      version,
      title,
      content,
      status: "draft",
      publishedAt: undefined,
      createdBy: auth.userId,
      createdAt: now,
      updatedAt: now,
    })

    const entry = await ctx.db.get(changelogId)
    if (!entry) {
      throw new Error("Failed to create changelog entry")
    }

    return {
      entry: {
        id: entry._id,
        projectId: entry.projectId,
        version: entry.version,
        title: entry.title,
        content: entry.content,
        status: entry.status,
        publishedAt: entry.publishedAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    }
  },
})

export const publishByApiKey = mutation({
  args: {
    apiKey: v.string(),
    changelogId: v.id("changelog"),
  },
  handler: async (ctx, args) => {
    const auth = await authenticateUserApiKey(ctx, args.apiKey)
    requireScope(auth.scopes, "changelog:write")

    const entry = await ctx.db.get(args.changelogId)
    if (!entry) {
      throw new Error("Changelog entry not found")
    }
    if (entry.status !== "draft") {
      throw new Error("Only draft entries can be published")
    }

    await requireProjectAdmin(ctx, entry.projectId, auth.userId)
    assertSemver(entry.version)

    const conflictingPublished = await ctx.db
      .query("changelog")
      .withIndex("by_project_version", (q) =>
        q.eq("projectId", entry.projectId).eq("version", entry.version)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
          q.neq(q.field("_id"), args.changelogId)
        )
      )
      .first()

    if (conflictingPublished) {
      throw new Error("This version has already been published")
    }

    const publishedAt = Date.now()
    await ctx.db.patch(args.changelogId, {
      status: "published",
      publishedAt,
      updatedAt: publishedAt,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.changelogWebhook.deliverPublishedWebhook,
      {
        changelogId: args.changelogId,
      }
    )

    return {
      changelogId: args.changelogId,
      status: "published" as const,
      publishedAt,
    }
  },
})
