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
    iconStorageId: v.optional(v.id("_storage")), // For uploaded images
    iconName: v.optional(v.string()), // For predefined Lucide icons
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

  feedback: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("bug"),
      v.literal("feature"),
      v.literal("improvement")
    ),
    status: v.union(
      v.literal("new"),
      v.literal("under_review"),
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("rejected")
    ),
    votes: v.number(),
    isPublic: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_project_category", ["projectId", "category"])
    .index("by_project_public", ["projectId", "isPublic"])
    .index("by_project_created_at", ["projectId", "createdAt"]),

  feedbackVotes: defineTable({
    feedbackId: v.id("feedback"),
    userId: v.optional(v.id("users")),
    anonymousId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_feedback", ["feedbackId"])
    .index("by_feedback_user", ["feedbackId", "userId"])
    .index("by_feedback_anonymous", ["feedbackId", "anonymousId"])
    .index("by_user", ["userId"])
    .index("by_anonymous", ["anonymousId"]),

  feedbackComments: defineTable({
    feedbackId: v.id("feedback"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_feedback", ["feedbackId"]),

  resources: defineTable({
    projectId: v.id("projects"),
    type: v.union(v.literal("file"), v.literal("link")),
    name: v.string(),
    folderId: v.optional(v.id("folders")), // Optional folder reference
    // For files
    storageId: v.optional(v.id("_storage")),
    fileType: v.optional(v.string()), // MIME type
    fileSize: v.optional(v.number()), // Size in bytes
    // For links
    url: v.optional(v.string()),
    favicon: v.optional(v.string()), // URL to favicon
    // Common fields
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_type", ["projectId", "type"])
    .index("by_folder", ["folderId"])
    .index("by_project_folder", ["projectId", "folderId"])
    .index("by_created_at", ["createdAt"]),

  folders: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    parentId: v.optional(v.id("folders")), // For nested folders
    type: v.union(v.literal("file"), v.literal("link")), // Which resource type
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_type", ["projectId", "type"])
    .index("by_parent", ["parentId"])
    .index("by_project_parent", ["projectId", "parentId"]),

  messages: defineTable({
    projectId: v.id("projects"),
    authorId: v.id("users"),
    content: v.string(),
    threadId: v.optional(v.id("messages")), // For message threading
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          type: v.string(),
        })
      )
    ),
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userId: v.id("users"),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()), // Soft delete
  })
    .index("by_project", ["projectId"])
    .index("by_author", ["authorId"])
    .index("by_thread", ["threadId"])
    .index("by_project_created", ["projectId", "createdAt"])
    .index("by_thread_created", ["threadId", "createdAt"]),

  // Track last read message timestamp per user per project
  messageReadStatus: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    lastReadAt: v.number(), // Timestamp of when user last read messages
  }).index("by_user_project", ["userId", "projectId"]),

  // Track who is currently typing in each project
  typingStatus: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    lastTypingAt: v.number(), // Timestamp of last typing activity
  })
    .index("by_user_project", ["userId", "projectId"])
    .index("by_project", ["projectId"]),
})

export default schema
