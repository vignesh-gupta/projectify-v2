/**
 * Migration script to convert project-level API keys to user-level API keys
 * 
 * This migration:
 * 1. Reads all existing project API keys from the apiKeys table
 * 2. Creates corresponding user API keys in the userApiKeys table
 * 3. Maps scopes: read:changelog → changelog:read + changelog:write (for owners/admins)
 * 4. Assigns keys to the user who created them (using createdBy field)
 * 5. Preserves key hashes, status, and usage data
 * 
 * Run this migration manually after deploying the schema changes.
 */

import { internalMutation } from "./_generated/server"

/**
 * Main migration function
 * 
 * This should be called manually after deploying the schema changes.
 * It will:
 * 1. Get all project API keys
 * 2. For each key, determine the user's role in the project
 * 3. Map scopes based on role (owners/admins get write access)
 * 4. Create user API key with preserved data
 * 
 * Returns a summary of the migration.
 */
export const migrateProjectKeysToUserKeys = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projectKeys = await ctx.db.query("apiKeys").collect()

    const results = {
      total: projectKeys.length,
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const projectKey of projectKeys) {
      try {
        // Get user's role in the project
        const membership = await ctx.db
          .query("memberships")
          .withIndex("by_project_user", (q) =>
            q.eq("projectId", projectKey.projectId).eq("userId", projectKey.createdBy)
          )
          .first()

        if (!membership) {
          results.errors.push(
            `Key ${projectKey._id}: User no longer has access to project`
          )
          results.skipped++
          continue
        }

        const role = membership.role

        // Map scopes: read:changelog → changelog:read + changelog:write (for owners/admins)
        const scopes: Array<
          | "projects:read"
          | "projects:write"
          | "tasks:read"
          | "tasks:write"
          | "feedback:read"
          | "feedback:write"
          | "changelog:read"
          | "changelog:write"
        > = []

        // All keys get read access to changelog
        scopes.push("changelog:read")

        // Owners and admins also get write access
        if (role === "owner" || role === "admin") {
          scopes.push("changelog:write")
        }

        // Create user API key directly
        const now = Date.now()
        await ctx.db.insert("userApiKeys", {
          userId: projectKey.createdBy,
          name: `${projectKey.name} (migrated from project)`,
          keyHash: projectKey.keyHash,
          keyPreview: projectKey.keyPreview,
          scopes,
          status: projectKey.status,
          lastUsedAt: projectKey.lastUsedAt,
          revokedAt: projectKey.revokedAt,
          createdAt: projectKey.createdAt,
          updatedAt: now,
        })

        results.migrated++
      } catch (error) {
        results.errors.push(
          `Key ${projectKey._id}: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        results.skipped++
      }
    }

    return results
  },
})
