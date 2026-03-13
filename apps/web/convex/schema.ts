import { v } from "convex/values"
import { defineSchema, defineTable } from "convex/server"
import { authTables } from "@convex-dev/auth/server"

const schema = defineSchema({
  ...authTables,
  projects: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("development"),
      v.literal("maintenance"),
      v.literal("inactive")
    ),
    dueDate: v.number(),
    iconStorageId: v.optional(v.id("_storage")),
  })
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  memberships: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    assigneeUserId: v.optional(v.id("users")),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_assignee", ["assigneeUserId"]),
})

export default schema
