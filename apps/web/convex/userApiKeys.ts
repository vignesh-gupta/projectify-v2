import { v } from "convex/values"
import { mutation, query, action, internalMutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { api, internal } from "./_generated/api"
import { Id } from "./_generated/dataModel"
import { authenticateApiKey } from "./lib/apiKeyAuth"

// Default configuration
const DEFAULT_MAX_KEYS = 10
const HARD_LIMIT_KEYS = 50

// Scope definitions
export const scopeValidator = v.union(
  v.literal("projects:read"),
  v.literal("projects:write"),
  v.literal("tasks:read"),
  v.literal("tasks:write"),
  v.literal("feedback:read"),
  v.literal("feedback:write"),
  v.literal("changelog:read"),
  v.literal("changelog:write")
)

// Helper function to generate API key
function generateApiKey(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let key = ""
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `uk_${key}`
}

// Helper function to create key preview
function createKeyPreview(key: string): string {
  // Show first 7 chars (including prefix) + last 4 chars
  // e.g., "uk_a1b2...o5p6"
  const prefix = key.substring(0, 7)
  const suffix = key.substring(key.length - 4)
  return `${prefix}...${suffix}`
}

// Helper function to hash API key using SHA-256
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Get user's API key configuration (or default)
 */
export const getUserApiKeyConfig = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const config = await ctx.db
      .query("apiKeyConfig")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()

    return {
      maxKeys: config?.maxKeys ?? DEFAULT_MAX_KEYS,
    }
  },
})

/**
 * Update user's API key limit (admin function)
 */
export const updateApiKeyLimit = mutation({
  args: {
    userId: v.id("users"),
    maxKeys: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx)
    if (!currentUserId) {
      throw new Error("Unauthorized")
    }

    // Validate limit
    if (args.maxKeys < 1 || args.maxKeys > HARD_LIMIT_KEYS) {
      throw new Error(
        `Invalid limit. Must be between 1 and ${HARD_LIMIT_KEYS}`
      )
    }

    const existingConfig = await ctx.db
      .query("apiKeyConfig")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    const now = Date.now()

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        maxKeys: args.maxKeys,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("apiKeyConfig", {
        userId: args.userId,
        maxKeys: args.maxKeys,
        createdAt: now,
        updatedAt: now,
      })
    }

    return { success: true }
  },
})

/**
 * List user's API keys
 */
export const listUserApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const keys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    return keys.map((key) => ({
      _id: key._id,
      name: key.name,
      keyPreview: key.keyPreview,
      scopes: key.scopes,
      status: key.status,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      revokedAt: key.revokedAt,
    }))
  },
})

/**
 * Get API key by ID
 */
export const getApiKeyById = query({
  args: {
    keyId: v.id("userApiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const key = await ctx.db.get(args.keyId)
    if (!key) {
      throw new Error("API key not found")
    }

    // Verify ownership
    if (key.userId !== userId) {
      throw new Error("Unauthorized")
    }

    return {
      _id: key._id,
      name: key.name,
      keyPreview: key.keyPreview,
      scopes: key.scopes,
      status: key.status,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      revokedAt: key.revokedAt,
    }
  },
})

/**
 * Get active API keys for a user (internal use)
 */
export const getActiveUserApiKeys = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect()

    return keys
  },
})

/**
 * Create a new API key
 */
export const createUserApiKey = mutation({
  args: {
    name: v.string(),
    scopes: v.array(scopeValidator),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    keyId: Id<"userApiKeys">
    apiKey: string
    keyPreview: string
  }> => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Validate name
    if (args.name.trim().length === 0) {
      throw new Error("API key name cannot be empty")
    }

    // Validate scopes
    if (args.scopes.length === 0) {
      throw new Error("At least one scope is required")
    }

    // Validate expiration
    if (args.expiresAt && args.expiresAt <= Date.now()) {
      throw new Error("Expiration date must be in the future")
    }

    // Check user's key limit
    const config = await ctx.db
      .query("apiKeyConfig")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()

    const maxKeys = config?.maxKeys ?? DEFAULT_MAX_KEYS

    const existingKeys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    if (existingKeys.length >= maxKeys) {
      throw new Error(
        `You have reached the maximum of ${maxKeys} API keys. Please revoke an existing key before creating a new one.`
      )
    }

    // Generate API key
    const apiKey = generateApiKey()
    const keyPreview = createKeyPreview(apiKey)

    // Hash the key (we'll do it inline since crypto.subtle is not available in mutations)
    // For now, we'll use a simple hash - in production, consider using an action
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    const now = Date.now()

    // Insert the key
    const keyId = await ctx.db.insert("userApiKeys", {
      userId,
      name: args.name,
      keyHash,
      keyPreview,
      scopes: args.scopes,
      status: "active",
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    })

    return {
      keyId,
      apiKey, // Return the full key only once
      keyPreview,
    }
  },
})

/**
 * Revoke an API key
 */
export const revokeUserApiKey = mutation({
  args: {
    keyId: v.id("userApiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const key = await ctx.db.get(args.keyId)
    if (!key) {
      throw new Error("API key not found")
    }

    // Verify ownership
    if (key.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Check if already revoked
    if (key.status === "revoked") {
      throw new Error("API key is already revoked")
    }

    const now = Date.now()

    await ctx.db.patch(args.keyId, {
      status: "revoked",
      revokedAt: now,
      updatedAt: now,
    })

    return { success: true }
  },
})

/**
 * Update API key scopes
 */
export const updateScopes = mutation({
  args: {
    keyId: v.id("userApiKeys"),
    scopes: v.array(scopeValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const key = await ctx.db.get(args.keyId)
    if (!key) {
      throw new Error("API key not found")
    }

    // Verify ownership
    if (key.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Validate scopes
    if (args.scopes.length === 0) {
      throw new Error("At least one scope is required")
    }

    const now = Date.now()

    await ctx.db.patch(args.keyId, {
      scopes: args.scopes,
      updatedAt: now,
    })

    return { success: true }
  },
})

/**
 * Renew API key (extend expiration)
 */
export const renewUserApiKey = mutation({
  args: {
    keyId: v.id("userApiKeys"),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const key = await ctx.db.get(args.keyId)
    if (!key) {
      throw new Error("API key not found")
    }

    // Verify ownership
    if (key.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Validate expiration
    if (args.expiresAt && args.expiresAt <= Date.now()) {
      throw new Error("Expiration date must be in the future")
    }

    const now = Date.now()

    await ctx.db.patch(args.keyId, {
      expiresAt: args.expiresAt,
      updatedAt: now,
    })

    return { success: true }
  },
})

/**
 * Authenticate API key and return user ID and scopes
 */
export const authenticateUserApiKey = action({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args): Promise<
    | { authenticated: true; userId: Id<"users">; scopes: string[] }
    | { authenticated: false; error: string }
  > => {
    // Validate key format
    if (!args.apiKey.startsWith("uk_")) {
      return { authenticated: false, error: "Invalid API key format" }
    }

    // Hash the provided key
    const keyHash = await hashApiKey(args.apiKey)

    // Find the key in the database
    const keys = await ctx.runQuery(api.userApiKeys.findKeyByHash, {
      keyHash,
    })

    if (keys.length === 0) {
      return { authenticated: false, error: "Invalid API key" }
    }

    const key = keys[0]!

    // Check if revoked
    if (key.status === "revoked") {
      return { authenticated: false, error: "API key has been revoked" }
    }

    // Check if expired
    if (key.expiresAt && key.expiresAt <= Date.now()) {
      return { authenticated: false, error: "API key has expired" }
    }

    // Update last used timestamp
    await ctx.runMutation(internal.userApiKeys.markKeyUsed, {
      keyId: key._id,
    })

    return {
      authenticated: true,
      userId: key.userId,
      scopes: key.scopes,
    }
  },
})

/**
 * Find API key by hash (internal query)
 */
export const findKeyByHash = query({
  args: {
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const keys = await ctx.db.query("userApiKeys").collect()
    return keys.filter((key) => key.keyHash === args.keyHash)
  },
})

/**
 * Mark API key as used (internal mutation)
 */
export const markKeyUsed = internalMutation({
  args: {
    keyId: v.id("userApiKeys"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, {
      lastUsedAt: Date.now(),
    })
  },
})

export const validateApiKey = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const auth = await authenticateApiKey(ctx, args.apiKey)
      const user = await ctx.db.get(auth.userId)
      return {
        valid: true as const,
        user: {
          id: auth.userId,
          name: user?.name ?? "",
          email: user?.email ?? "",
        },
      }
    } catch (error) {
      return {
        valid: false as const,
        error: error instanceof Error ? error.message : "Invalid API key",
      }
    }
  },
})
