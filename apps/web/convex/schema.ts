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
    dueDate: v.optional(v.number()), // Made optional for flexibility
    iconStorageId: v.optional(v.id("_storage")), // Null = show project initials
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"])
    .index("by_created_at", ["createdAt"]),

  memberships: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"), // Track who created the task
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_assignee", ["assigneeUserId"])
    .index("by_project_status", ["projectId", "status"]) // Efficient filtering
    .index("by_created_at", ["createdAt"]),
})

export default schema
