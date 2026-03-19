# Convex Schema Documentation

## Overview

The Projectify Convex schema defines three main tables for project management:

## Database Schema

### 1. **Projects** Table

Stores project information with status tracking and optional icon uploads.

**Fields:**
- `title` (string): Project name
- `description` (string): Project description
- `status` (enum): `"development"` | `"maintenance"` | `"inactive"`
- `dueDate` (optional number): Unix timestamp for project deadline
- `iconStorageId` (optional storage ID): Reference to uploaded project icon
  - When `null`, UI should display project initials as fallback
- `createdAt` (number): Unix timestamp when created
- `updatedAt` (number): Unix timestamp of last update

**Indexes:**
- `by_status`: Query projects by status
- `by_due_date`: Query projects by due date
- `by_created_at`: Query projects by creation date

### 2. **Memberships** Table

Maps users to projects with role-based access control.

**Fields:**
- `projectId` (ID): Reference to projects table
- `userId` (ID): Reference to users table (from authTables)
- `role` (enum): `"owner"` | `"admin"` | `"member"`
- `joinedAt` (number): Unix timestamp when user joined project

**Indexes:**
- `by_project`: Get all members of a project
- `by_user`: Get all projects for a user
- `by_project_user`: Check specific user membership in a project

**Roles:**
- **Owner**: Full control, can manage members and delete project
- **Admin**: Can manage tasks and members (except owners)
- **Member**: Can view and create tasks

### 3. **Tasks** Table

Core work items linked to projects with assignment and tracking.

**Fields:**
- `projectId` (ID): Reference to projects table
- `title` (string): Task name
- `description` (optional string): Detailed task description
- `status` (enum): `"todo"` | `"in_progress"` | `"done"`
- `priority` (enum): `"low"` | `"medium"` | `"high"`
- `dueDate` (optional number): Unix timestamp for task deadline
- `assigneeUserId` (optional ID): Reference to assigned user
- `createdAt` (number): Unix timestamp when created
- `updatedAt` (number): Unix timestamp of last update
- `createdBy` (ID): Reference to user who created the task

**Indexes:**
- `by_project`: Get all tasks for a project
- `by_status`: Query tasks by status
- `by_assignee`: Get tasks assigned to a user
- `by_project_status`: Efficiently filter tasks by project and status
- `by_created_at`: Query tasks by creation date

## Convex Functions

### Projects (`convex/projects.ts`)

- **`create`**: Create new project and add creator as owner
- **`list`**: Get all projects for current user
- **`update`**: Update project (requires admin/owner role)
- **`generateUploadUrl`**: Generate URL for uploading project icons

### Tasks (`convex/tasks.ts`)

- **`create`**: Create new task in a project
- **`listByProject`**: Get all tasks for a project (with optional status filter)
- **`update`**: Update task details
- **`remove`**: Delete a task (requires permission)

### Memberships (`convex/memberships.ts`)

- **`add`**: Add member to project (requires admin/owner)
- **`updateRole`**: Change member's role (requires owner)
- **`remove`**: Remove member or leave project
- **`listByProject`**: Get all members of a project

## Image Upload Flow

To upload a project icon:

1. Call `projects.generateUploadUrl()` to get upload URL
2. POST image file to the upload URL
3. Get `storageId` from response
4. Use `storageId` when creating/updating project

```typescript
// Example:
const uploadUrl = await convex.mutation(api.projects.generateUploadUrl);
const response = await fetch(uploadUrl, {
  method: "POST",
  body: imageFile,
});
const { storageId } = await response.json();

// Use storageId when creating project
await convex.mutation(api.projects.create, {
  title: "My Project",
  description: "...",
  status: "development",
  iconStorageId: storageId,
});
```

## Relationships

```
users (authTables)
  ↓
memberships ←→ projects
  ↓               ↓
  └──────→ tasks ←┘
```

- Users join projects through memberships
- Tasks belong to projects
- Tasks can be assigned to users
- All operations respect membership roles and permissions
