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
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          type: v.string(),
          size: v.number(),
          uploadedBy: v.id("users"),
          uploadedAt: v.number(),
        })
      )
    ),
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
    createdBy: v.optional(v.id("users")),
    submitterName: v.optional(v.string()),
    submitterEmail: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
    linkedTaskId: v.optional(v.id("tasks")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_project_category", ["projectId", "category"])
    .index("by_project_public", ["projectId", "isPublic"])
    .index("by_project_created_at", ["projectId", "createdAt"])
    .index("by_linked_task", ["linkedTaskId"]),

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

  changelog: defineTable({
    projectId: v.id("projects"),
    version: v.string(),
    title: v.string(),
    content: v.string(), // Stored as HTML from the rich text editor
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_project_version", ["projectId", "version"])
    .index("by_project_published", ["projectId", "publishedAt"]),

  apiKeys: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    keyHash: v.string(),
    keyPreview: v.string(),
    scopes: v.array(v.literal("read:changelog")),
    status: v.union(v.literal("active"), v.literal("revoked")),
    createdBy: v.id("users"),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"]),

  webhooks: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    url: v.string(),
    event: v.literal("changelog.published"),
    signingSecret: v.string(),
    secretPreview: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
    lastDeliveredAt: v.optional(v.number()),
    lastDeliveryStatus: v.optional(
      v.union(v.literal("success"), v.literal("failed"))
    ),
    createdBy: v.id("users"),
    disabledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"]),

  webhookDeliveries: defineTable({
    webhookId: v.id("webhooks"),
    projectId: v.id("projects"),
    event: v.literal("changelog.published"),
    changelogId: v.id("changelog"),
    requestUrl: v.string(),
    requestBody: v.string(),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    deliveredAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_webhook", ["webhookId"])
    .index("by_project", ["projectId"])
    .index("by_changelog", ["changelogId"]),

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

  // Task comments for discussions
  taskComments: defineTable({
    taskId: v.id("tasks"),
    authorId: v.id("users"),
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
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userIds: v.array(v.id("users")),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_task", ["taskId", "createdAt"])
    .index("by_thread", ["threadId", "createdAt"])
    .index("by_author", ["authorId"]),

  // Notifications for users
  notifications: defineTable({
    userId: v.id("users"), // Who receives this notification
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_unassigned"),
      v.literal("task_status_changed"),
      v.literal("task_due_soon"),
      v.literal("message_mentioned"),
      v.literal("task_comment"),
      v.literal("comment_mention"),
      v.literal("comment_reply")
    ),
    taskId: v.optional(v.id("tasks")), // Related task (if applicable)
    commentId: v.optional(v.id("taskComments")), // Related comment (if applicable)
    messageId: v.optional(v.id("messages")), // Related message (if applicable)
    projectId: v.id("projects"), // Related project
    triggeredBy: v.id("users"), // Who triggered this notification
    title: v.string(), // Notification title
    message: v.string(), // Notification message
    isRead: v.boolean(),
    metadata: v.optional(
      v.object({
        taskTitle: v.optional(v.string()),
        oldStatus: v.optional(v.string()),
        newStatus: v.optional(v.string()),
        messagePreview: v.optional(v.string()),
        commentPreview: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_task", ["taskId"]),
})

export default schema
