# PLAN.md - Projectify v2 Development Plan

**Last Updated**: April 2, 2026  
**Project Status**: Phase 1 Complete (Foundation), Phase 2 Complete (Core Features), Phase 3 In Progress (Collaboration Features - ~60% Complete)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Completed Work](#completed-work)
3. [Current Status](#current-status)
4. [Development Phases](#development-phases)
5. [Detailed Implementation Plan](#detailed-implementation-plan)
6. [Technical Debt & Refactoring](#technical-debt--refactoring)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Strategy](#deployment-strategy)
9. [Timeline & Milestones](#timeline--milestones)

---

## Project Overview

**Project Name**: Projectify v2  
**Description**: Modern project management tool for small teams  
**Tech Stack**: Next.js 16, React 19, TypeScript, Convex, Tailwind CSS v4, shadcn/ui  
**Architecture**: Monorepo with Turborepo  
**Target Users**: Small teams (2-10 members)

**Repository Structure**:
```
projectify-v2/
├── apps/web/              # Main Next.js application
├── packages/
│   ├── ui/                # Shared UI components (shadcn/ui)
│   ├── eslint-config/     # Shared ESLint configs
│   └── typescript-config/ # Shared TypeScript configs
├── PRD.md                 # Product Requirements Document
└── PLAN.md                # This file
```

---

## Completed Work

### ✅ Phase 1: Foundation (100% Complete)

#### 1.1 Project Setup
- [x] Monorepo setup with Turborepo
- [x] Next.js 16 with App Router configuration
- [x] TypeScript 5.9+ configuration
- [x] Tailwind CSS v4 setup
- [x] ESLint & Prettier configuration
- [x] Convex backend initialization
- [x] Shared packages structure (ui, eslint-config, typescript-config)

#### 1.2 Authentication System
- [x] Convex Auth integration
- [x] GitHub OAuth implementation
- [x] User registration flow
- [x] User login flow
- [x] Session management (24-hour duration)
- [x] Auth context provider
- [x] Protected route handling with `proxy.ts`
- [x] User profile queries
- [x] Route protection for `/project/*` and `/dashboard/*`

**Files Created**:
- `apps/web/convex/auth.ts`
- `apps/web/convex/auth.config.ts`
- `apps/web/convex/functions/auth.ts`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/register/page.tsx`
- `apps/web/proxy.ts` (Next.js 16 middleware alternative)

#### 1.3 Database Schema
- [x] Schema definition with Convex
- [x] `projects` table with indexes
- [x] `memberships` table with compound indexes
- [x] `tasks` table with multiple indexes
- [x] `users` table (via Convex Auth)
- [x] All relationships properly indexed

**File**: `apps/web/convex/schema.ts`

#### 1.4 Backend Functions (Convex)

**Projects Module** (`apps/web/convex/projects.ts`):
- [x] `create` - Create new project
- [x] `list` - Get user's projects
- [x] `update` - Update project details
- [x] `getProject` - Get single project with verification
- [x] `getProjectAnalytics` - Get project statistics
- [x] `generateUploadUrl` - Get upload URL for project icons

**Tasks Module** (`apps/web/convex/tasks.ts`):
- [x] `create` - Create task
- [x] `listByProject` - Get tasks with filtering
- [x] `update` - Update task
- [x] `remove` - Delete task

**Memberships Module** (`apps/web/convex/memberships.ts`):
- [x] `add` - Add member to project
- [x] `updateRole` - Change member role
- [x] `remove` - Remove member
- [x] `listByProject` - Get project members

**Users Module** (`apps/web/convex/users.ts`):
- [x] `updateProfile` - Update user profile
- [x] `leaveProject` - Leave specific project
- [x] `leaveAllProjects` - Leave all projects
- [x] `deleteAccount` - Delete account with cascading
- [x] `getUserProjects` - Get user's projects

#### 1.5 UI Component Library
- [x] shadcn/ui components setup in `packages/ui/`
- [x] Button, Card, Dialog, Input, Label components
- [x] Avatar, Tabs, Select, Textarea components
- [x] Sidebar, Sheet, Tooltip components
- [x] Alert Dialog, Skeleton components
- [x] Theme provider (light/dark mode)
- [x] Toaster for notifications

#### 1.6 Core Pages & Routes

**Landing Page** (`app/page.tsx`):
- [x] Hero section
- [x] Feature highlights
- [x] Logo cloud
- [x] Infinite slider animation

**Auth Pages** (`app/(auth)/`):
- [x] Login page with GitHub OAuth
- [x] Register page with GitHub OAuth
- [x] Auth layout

**Main Dashboard** (`app/(main-dashboard)/dashboard/page.tsx`):
- [x] Dashboard component
- [x] Stats grid
- [x] Projects list
- [x] Create project dialog
- [x] Project cards with animations

**User Settings** (`app/(main-dashboard)/settings/page.tsx`):
- [x] Account settings tab (name, email)
- [x] Projects management tab (leave projects)
- [x] Danger zone tab (delete account)

**Project Dashboard** (`app/project/[id]/page.tsx`):
- [x] Project layout with sidebar
- [x] Project dashboard with analytics
- [x] Task statistics cards
- [x] Team statistics
- [x] Completion rate display
- [x] Overdue tasks alerts

#### 1.7 Custom Components

**Navigation**:
- [x] `app-sidebar.tsx` - Main app sidebar
- [x] `project-sidebar.tsx` - Project-specific sidebar
- [x] `user-profile-dropdown.tsx` - User menu

**Dashboard**:
- [x] `dashboard.tsx` - Main dashboard container
- [x] `dashboard/dashboard-header.tsx` - Header with stats
- [x] `dashboard/stats-grid.tsx` - Statistics display
- [x] `dashboard/projects-list.tsx` - Project grid
- [x] `dashboard/project-card.tsx` - Individual project card
- [x] `dashboard/add-project-button.tsx` - Add project CTA
- [x] `dashboard/create-project-dialog.tsx` - Create project modal

**Settings**:
- [x] `settings/account-settings.tsx` - Profile editing
- [x] `settings/projects-list.tsx` - User projects with actions
- [x] `settings/delete-account.tsx` - Account deletion

#### 1.8 Permissions & Access Control
- [x] Role-based access (owner, admin, member)
- [x] Membership verification on all operations
- [x] Owner-only role changes
- [x] Admin/owner project management
- [x] Task creator tracking
- [x] Orphaned project prevention
- [x] Cascade deletion on account removal

#### 1.9 Bug Fixes & Improvements
- [x] **Fixed**: Auth context not passing to Server Components
  - Converted project layout and page to Client Components
  - Updated ProjectSidebar to fetch data with `useQuery`
  - Fixed `userId` being null in `getProject` query
  - **Date**: March 21, 2026

- [x] **Fixed**: Authorization error on project pages
  - Updated `proxy.ts` to protect `/project(.*)` routes
  - Added `/login` and `/register` to sign-in pages matcher
  - Fixed TypeScript params type in project layout
  - Unauthenticated users now redirected to login
  - **Date**: March 24, 2026

- [x] **Enhanced**: Rich text editor for task descriptions
  - Integrated Tiptap with full toolbar (bold, italic, underline, etc.)
  - Added headings (H1, H2, H3), lists, code blocks, links
  - Implemented superscript, subscript, text alignment
  - Fixed view mode to be truly non-editable
  - Fixed HTML rendering in task cards (no raw tags)
  - **Date**: March 24, 2026

- [x] **Implemented**: Complete resource management system
  - Added file upload with drag-and-drop support
  - Implemented link creation and management
  - Added folder organization for files and links
  - Implemented upload progress tracking
  - Added file renaming and deletion
  - Integrated Convex storage for file uploads
  - **Date**: March 25-28, 2026

- [x] **Implemented**: Project settings UI
  - Built general settings tab with icon upload
  - Created member management tab with invite functionality
  - Added permissions display
  - Implemented danger zone for project deletion
  - Added icon selector with Lucide icons + custom upload
  - **Date**: March 25-28, 2026

---

## Current Status

### 📊 Overall Progress: ~80% Complete

**What's Working**:
- ✅ Complete authentication system (GitHub OAuth)
- ✅ Full project CRUD with analytics
- ✅ Complete team/membership management backend & UI
- ✅ Task management backend (create, update, delete, list)
- ✅ Task management UI (Kanban board, data table, dialogs)
- ✅ Rich text editor for task descriptions (Tiptap)
- ✅ Drag-and-drop task status updates
- ✅ User account management (profile, delete account)
- ✅ Project and user dashboards with analytics
- ✅ Role-based permissions system
- ✅ UI component library
- ✅ Route protection with proxy.ts
- ✅ Project Settings UI (general, members, permissions, danger zone)
- ✅ Resource management backend (files & links)
- ✅ Resource management UI (file upload, link creation, folders)
- ✅ File drag-and-drop upload with progress tracking
- ✅ Folder organization for resources
- ✅ Feedback system (create, update, voting, comments)
- ✅ Public feedback board with view/vote mode

**What's Partially Done**:
- 🚧 Folder management (rename/delete operations pending)
- 🚧 Public feedback submissions and embed/API endpoints

**What's Not Started**:
- ❌ Email/Password authentication
- ❌ Google OAuth authentication
- ❌ Changelog management
- ❌ Group messaging
- ❌ Team concept (multi-project teams)
- ❌ Notification system
- ❌ Task assignment, comments & discussions 
- ❌ File attachments for tasks
- ❌ Advanced analytics (time tracking, burndown charts, velocity)
- ❌ Project templates

---

## Development Phases

### Phase 1: Foundation ✅ (100% Complete)
**Duration**: Completed  
**Status**: DONE

- [x] Project setup & configuration
- [x] Authentication system
- [x] Database schema
- [x] Backend API functions
- [x] UI component library
- [x] Basic pages & navigation

---

### Phase 2: Core Features ✅ (80% Complete)
**Status**: DONE  
**Priority**: HIGH

#### 2.1 Task Management UI ✅ (98% Complete)
- [x] Create `TaskKanbanBoard` component (Kanban view)
- [x] Create `TaskDataTable` component (Table view)
- [x] Create `TaskCard` component with HTML rendering
- [x] Create `CreateTaskDialog` component with rich text editor
- [x] Create `TaskDetailSheet` component with edit mode
- [x] Implement drag-and-drop for status changes (@dnd-kit)
- [x] Add task filtering (by status, assignee, priority)
- [x] Add task sorting
- [x] Implement Tiptap rich text editor for descriptions
- [x] Add toolbar with formatting options (bold, italic, underline, etc.)
- [x] Add headings, lists, code blocks, links, super/subscript
- [x] Add text alignment options
- [x] Fix view mode to be non-editable
- [x] Fix HTML rendering in task cards
- [x] Add loading & empty states
- [x] Add delete task dialog with confirmation
- [ ] Task assignment with member dropdown

**Files Created**:
```
apps/web/app/project/[id]/work-items/
├── page.tsx ✅
├── loading.tsx ✅
├── error.tsx ✅
└── components/
    ├── task-kanban-board.tsx ✅
    ├── task-data-table.tsx ✅
    ├── task-card.tsx ✅ (with HTML rendering)
    ├── task-columns.tsx ✅
    ├── kanban-column.tsx ✅
    ├── create-task-dialog.tsx ✅ (with rich text editor)
    ├── task-detail-sheet.tsx ✅ (with rich text editor)
    └── delete-task-dialog.tsx ✅

apps/web/components/
└── rich-text-editor.tsx ✅ (Tiptap integration)
```

**Dependencies Added**:
- @tiptap/react
- @tiptap/starter-kit
- @tiptap/extension-link
- @tiptap/extension-underline
- @tiptap/extension-superscript
- @tiptap/extension-subscript
- @tiptap/extension-text-align
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
- react-dropzone
- lucide-react

#### 2.2 Complete Authentication Options (Not Started)
  - [ ] Implement email/password authentication
  - [ ] Add email/password provider to Convex Auth
  - [ ] Create email verification flow
  - [ ] Add password reset functionality
  - [ ] Implement Google OAuth
  - [ ] Add Google provider to Convex Auth config
  - [ ] Update login/register pages
  - [ ] Test OAuth flow

**Files to Update**:
- `apps/web/convex/auth.ts`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/register/page.tsx`

#### 2.3 Project Settings UI ✅ (100% Complete)
- [x] Create project settings page structure
- [x] Add general settings tab (name, description, icon)
- [x] Add members tab with management UI
- [x] Add permissions tab
- [x] Add danger zone (delete project)
- [x] Implement project icon upload
- [x] Add project status management
- [x] Implement icon selector (Lucide icons + custom upload)
- [x] Add member invite dialog
- [x] Add read-only mode for non-admins

**Files Created**:
```
apps/web/app/project/[id]/settings/
├── page.tsx ✅
└── components/
    ├── general-settings.tsx ✅
    ├── member-management.tsx ✅
    ├── invite-member-dialog.tsx ✅
    ├── icon-selector.tsx ✅
    ├── permissions-display.tsx ✅
    └── danger-zone.tsx ✅
```

#### 2.4 Member Management UI ✅ (100% Complete)
- [x] Create member list component
- [x] Create invite member dialog
- [x] Add member role badges
- [x] Add role change dropdown (owner only)
- [x] Add remove member confirmation
- [x] Show member join date
- [x] Integrated into project settings page

**Files Created**:
```
apps/web/app/project/[id]/settings/components/
├── member-management.tsx ✅ (includes member list & cards)
└── invite-member-dialog.tsx ✅
```

#### 2.5 Notification System (Not Started)
- [ ] Design notification schema
- [ ] Create backend functions for notifications
- [ ] Add notification bell icon to header
- [ ] Create notification dropdown
- [ ] Implement real-time notification updates
- [ ] Add notification preferences
- [ ] Mark as read functionality

**Database Schema**:
```typescript
notifications: defineTable({
  userId: v.id("users"),
  type: v.string(), // "task_assigned", "member_added", etc.
  title: v.string(),
  message: v.string(),
  link: v.optional(v.string()),
  read: v.boolean(),
  createdAt: v.number(),
})
```

**Files to Create**:
- `apps/web/convex/notifications.ts`
- `apps/web/components/notifications-dropdown.tsx`
- `apps/web/components/notification-item.tsx`

---

### Phase 3: Collaboration Features 🔄 (~60% Complete)
**Estimated Duration**: 6-8 weeks  
**Priority**: MEDIUM

#### 3.1 Resource Management ✅ (95% Complete)
- [x] Design resource schema (files & links)
- [x] Implement file upload to Convex storage
- [x] Create backend functions (create, list, update, delete)
- [x] Build resource list UI (separate files & links pages)
- [x] Create file upload with drag-and-drop
- [x] Create link add dialog
- [x] Add resource folders for organization
- [x] Add file rename functionality
- [x] Add download functionality
- [x] Implement upload progress tracking
- [x] Add file type icons and size formatting
- [x] Add delete confirmation dialogs
- [ ] Implement folder rename/delete operations
- [ ] Add file preview functionality
- [ ] Implement resource search

**Database Schema**: ✅ Implemented in `apps/web/convex/schema.ts`
```typescript
resources: defineTable({
  projectId: v.id("projects"),
  type: v.union(v.literal("file"), v.literal("link")),
  name: v.string(),
  storageId: v.optional(v.id("_storage")), // For files
  fileType: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  url: v.optional(v.string()), // For links
  favicon: v.optional(v.string()),
  folderId: v.optional(v.id("folders")),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})

folders: defineTable({
  projectId: v.id("projects"),
  name: v.string(),
  parentId: v.optional(v.id("folders")),
  type: v.union(v.literal("file"), v.literal("link")),
  createdBy: v.id("users"),
  createdAt: v.number(),
})
```

**Files Created**:
```
apps/web/convex/
├── resources.ts ✅ (generateUploadUrl, createFile, createLink, listByProject, update, remove)
└── folders.ts ✅ (createFolder, listFolders)

apps/web/app/project/[id]/resources/
├── page.tsx ✅ (overview page)
├── files/
│   ├── page.tsx ✅
│   └── components/
│       ├── file-list.tsx ✅
│       ├── drop-zone-wrapper.tsx ✅
│       ├── upload-progress-panel.tsx ✅
│       ├── rename-file-dialog.tsx ✅
│       └── delete-resource-dialog.tsx ✅
└── links/
    ├── page.tsx ✅
    └── components/
        ├── link-list.tsx ✅
        ├── create-link-dialog.tsx ✅
        ├── edit-link-dialog.tsx ✅
        └── delete-resource-dialog.tsx ✅

apps/web/components/
└── folder-nav.tsx ✅
```

**Dependencies Added**:
- react-dropzone (for drag-and-drop uploads)
- lucide-react (for file type icons)

#### 3.2 Group Messaging (Complete) ✅
- [x] Design messages schema with threading
- [x] Create backend functions (send, list, update, delete)
- [x] Build real-time message list
- [x] Create message input component
- [x] Implement message threading
- [x] Add file attachments to messages
- [x] Add message reactions
- [x] Implement @mentions
- [x] Add typing indicators
- [x] Add message search
- [x] Implement unread message counter

**All bugs fixed (Round 2)**:
- [x] Fixed mention autocomplete positioning with viewport-aware logic (Math.max to prevent off-screen)
- [x] Fixed mention regex to only capture @username (not extra words after)
- [x] Fixed mention hover popover overflow with fixed positioning and viewport detection
- [x] Auto-create messages folder in resources if not exists (ensureMessagesFolder mutation)
- [x] Navigate to resources with folderId instead of folder name query param
- [x] Preserved original file names in attachments (during upload and after sending)
- [x] Fixed message list scrolling (proper flex layout without page scroll)
- [x] Implemented proper file download (blob creation with anchor element)
- [x] Added navigation to resources page on attachment click


**Database Schema**:
```typescript
messages: defineTable({
  projectId: v.id("projects"),
  authorId: v.id("users"),
  content: v.string(),
  threadId: v.optional(v.id("messages")),
  attachments: v.optional(v.array(v.object({
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
  }))),
  reactions: v.optional(v.object({})), // emoji: userId[]
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
})

messageReadStatus: defineTable({
  userId: v.id("users"),
  projectId: v.id("projects"),
  messageId: v.id("messages"),
  readAt: v.number(),
})

typingStatus: defineTable({
  userId: v.id("users"),
  projectId: v.id("projects"),
  lastTypingAt: v.number(),
})
```

**Files Created**:
- `apps/web/convex/messages.ts` - Backend functions with file upload support
- `apps/web/convex/typing.ts` - Typing indicator backend
- `apps/web/convex/mentions.ts` - @mention autocomplete backend
- `apps/web/app/project/[id]/messages/page.tsx` - Main messages page with search
- `apps/web/app/project/[id]/messages/components/message-list.tsx` - Real-time message display
- `apps/web/app/project/[id]/messages/components/message-item.tsx` - Individual message with reactions
- `apps/web/app/project/[id]/messages/components/message-input.tsx` - Input with file upload, typing, @mentions
- `apps/web/app/project/[id]/messages/components/message-thread.tsx` - Threading UI
- `apps/web/app/project/[id]/messages/components/message-search.tsx` - Search dialog
- `apps/web/app/project/[id]/messages/components/message-attachment.tsx` - Attachment display with download
- `apps/web/app/project/[id]/messages/components/typing-indicator.tsx` - Animated typing status
- `apps/web/app/project/[id]/messages/components/mention-autocomplete.tsx` - @mention dropdown
- `apps/web/app/project/[id]/messages/components/mention.tsx` - Mention hover popover


#### 3.3 Feedback System ✅ (90% Complete)
- [x] Design feedback schema
- [x] Create backend functions (create, list, update, vote, comments, convert-to-task)
- [x] Build feedback board UI
- [x] Create feedback submission form
- [x] Implement voting system
- [x] Add feedback comments
- [x] Add feedback status workflow
- [x] Create convert-to-task functionality
- [x] Build public feedback board (view/vote mode)
- [x] Add feedback categories
- [ ] Build public feedback submission flow
- [ ] Build public feedback integration API and a simple sheet doc on the page

**Database Schema**:
```typescript
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

feedbackVotes: defineTable({
  feedbackId: v.id("feedback"),
  userId: v.id("users"),
  createdAt: v.number(),
})

feedbackComments: defineTable({
  feedbackId: v.id("feedback"),
  authorId: v.id("users"),
  content: v.string(),
  createdAt: v.number(),
})
```

**Files to Create**:
- `apps/web/convex/feedback.ts`
- `apps/web/app/project/[id]/feedbacks/page.tsx`
- `apps/web/app/project/[id]/feedbacks/components/feedback-board.tsx`
- `apps/web/app/project/[id]/feedbacks/components/feedback-card.tsx`
- `apps/web/app/project/[id]/feedbacks/components/create-feedback-dialog.tsx`
- `apps/web/app/feedback-board/[projectId]/page.tsx` (public board)

#### 3.4 Task Comments & Discussions (Not Started)
- [ ] Design comments schema
- [ ] Create backend functions (create, list, update, delete)
- [ ] Add comments section to task detail sheet
- [ ] Implement comment threading
- [ ] Add @mentions in comments
- [ ] Add reactions to comments
- [ ] Implement real-time comment updates

**Database Schema**:
```typescript
taskComments: defineTable({
  taskId: v.id("tasks"),
  authorId: v.id("users"),
  content: v.string(),
  threadId: v.optional(v.id("taskComments")),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
```

#### 3.5 File Attachments for Tasks (Not Started)
- [ ] Add attachments to task schema
- [ ] Create file upload functionality
- [ ] Display attachments in task detail
- [ ] Add download functionality
- [ ] Add attachment preview

---

### Phase 4: Public Features & Integrations 🔮 (0% Complete)
**Estimated Duration**: 4-6 weeks  
**Priority**: LOW

#### 4.1 Changelog Management (Not Started)
- [ ] Design changelog schema
- [ ] Create backend functions (create, list, update, publish)
- [ ] Build changelog management UI
- [ ] Create changelog entry form
- [ ] Implement version numbering (semver)
- [ ] Add markdown support
- [ ] Build public changelog page
- [ ] Create embeddable changelog widget
- [ ] Add RSS feed for changelog
- [ ] Implement email notifications for releases

**Database Schema**:
```typescript
changelog: defineTable({
  projectId: v.id("projects"),
  version: v.string(),
  title: v.string(),
  description: v.string(), // Markdown
  category: v.union(
    v.literal("added"),
    v.literal("changed"),
    v.literal("fixed"),
    v.literal("removed")
  ),
  status: v.union(v.literal("draft"), v.literal("published")),
  publishedAt: v.optional(v.number()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

**Files to Create**:
- `apps/web/convex/changelog.ts`
- `apps/web/app/project/[id]/changelog/page.tsx`
- `apps/web/app/changelog/[projectId]/page.tsx` (public)
- Widget embed code

#### 4.2 Public API & Webhooks (Not Started)
- [ ] Design API authentication (API keys)
- [ ] Create HTTP endpoints for public data
- [ ] Implement webhook system
- [ ] Add webhook management UI
- [ ] Document API endpoints
- [ ] Create API key management

#### 4.3 Third-party Integrations (Not Started)
- [ ] GitHub integration (link repos, sync issues)
- [ ] Slack integration (notifications)
- [ ] Discord integration (notifications)
- [ ] Email integration (notifications)

---

### Phase 5: Advanced Features 🔮 (0% Complete)
**Estimated Duration**: 6-8 weeks  
**Priority**: FUTURE

#### 5.1 Team Concept (Multi-tenant) (Not Started)
- [ ] Design teams schema
- [ ] Create backend functions
- [ ] Build team management UI
- [ ] Implement team invitations
- [ ] Add projects to teams
- [ ] Team-level permissions

#### 5.2 Advanced Analytics (Not Started)
- [ ] Time tracking on tasks
- [ ] Burndown charts
- [ ] Velocity tracking
- [ ] Custom reports
- [ ] Data export (CSV, PDF)

#### 5.3 Project Templates (Not Started)
- [ ] Create template system
- [ ] Build template library
- [ ] Allow custom templates
- [ ] Template marketplace

#### 5.4 Mobile Applications (Not Started)
- [ ] React Native setup
- [ ] iOS app
- [ ] Android app

---

## Detailed Implementation Plan

### Priority 1: Complete Work Items UI (Next Sprint)

**Goal**: Build full task management interface

**Steps**:

1. **Create Task Board Component** (2-3 days)
   ```typescript
   // apps/web/app/project/[id]/work-items/components/task-board.tsx
   - Implement Kanban board with columns (Todo, In Progress, Done)
   - Add drag-and-drop functionality (use @dnd-kit/core)
   - Integrate with Convex task queries
   - Handle real-time updates
   ```

2. **Create Task Card Component** (1 day)
   ```typescript
   // apps/web/app/project/[id]/work-items/components/task-card.tsx
   - Display task title, assignee, priority, due date
   - Add priority color coding
   - Show assignee avatar
   - Add quick actions (edit, delete)
   ```

3. **Create Task Detail Sheet** (2 days)
   ```typescript
   // apps/web/app/project/[id]/work-items/components/task-detail-sheet.tsx
   - Show full task details
   - Add inline editing
   - Display task metadata (creator, dates)
   - Show task activity log (future)
   ```

4. **Create Task Dialog** (1-2 days)
   ```typescript
   // apps/web/app/project/[id]/work-items/components/create-task-dialog.tsx
   - Form with all task fields
   - Member dropdown for assignment
   - Date picker for due date
   - Priority selector
   - Form validation
   ```

5. **Add Task Filters & Search** (1 day)
   ```typescript
   // apps/web/app/project/[id]/work-items/components/task-filters.tsx
   - Filter by status, assignee, priority
   - Search by task title
   - Sort options (due date, created date, priority)
   ```

6. **Update Work Items Page** (1 day)
   ```typescript
   // apps/web/app/project/[id]/work-items/page.tsx
   - Replace placeholder with actual components
   - Add view toggle (board vs list)
   - Implement loading states
   - Add empty state
   ```

**Total Estimated Time**: 8-10 days

---

### Priority 2: Complete Authentication Options

**Goal**: Add email/password and Google OAuth

**Steps**:

1. **Email/Password Auth** (3-4 days)
   - Update Convex Auth config
   - Add password hashing
   - Create email verification flow
   - Add password reset functionality
   - Update login/register pages

2. **Google OAuth** (1-2 days)
   - Add Google provider to Convex Auth
   - Configure Google OAuth app
   - Update login/register UI
   - Test OAuth flow

**Total Estimated Time**: 4-6 days

---

### Priority 3: Project Settings & Member Management

**Goal**: Complete project settings interface

**Steps**:

1. **General Settings Tab** (2 days)
   - Project info editing
   - Icon upload
   - Status management

2. **Member Management Tab** (3 days)
   - Member list with roles
   - Invite member dialog
   - Role change UI (owner only)
   - Remove member confirmation

3. **Danger Zone** (1 day)
   - Delete project functionality
   - Confirmation dialog

**Total Estimated Time**: 6 days

---

## Technical Debt & Refactoring

### Immediate Issues
- [ ] Add proper error boundaries to all pages
- [ ] Implement consistent loading states
- [ ] Add proper TypeScript types for all props
- [ ] Extract repeated logic into custom hooks
- [ ] Add unit tests for utility functions

### Code Quality Improvements
- [ ] Add Storybook for component documentation
- [ ] Implement E2E tests with Playwright
- [ ] Add component integration tests
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [ ] Add JSDoc comments to all functions

### Performance Optimizations
- [ ] Implement virtual scrolling for long lists
- [ ] Add image optimization
- [ ] Lazy load heavy components
- [ ] Implement proper caching strategies
- [ ] Optimize bundle size

---

## Testing Strategy

### Unit Tests
- [ ] Set up Jest & React Testing Library
- [ ] Test utility functions in `lib/`
- [ ] Test custom hooks
- [ ] Aim for 80% code coverage

### Integration Tests
- [ ] Test user flows (auth, create project, create task)
- [ ] Test component interactions
- [ ] Test form submissions

### E2E Tests
- [ ] Set up Playwright
- [ ] Test critical user journeys:
  - User registration & login
  - Create project
  - Add team members
  - Create and manage tasks
  - Update profile
  - Delete account

---

## Deployment Strategy

### Current Setup
- **Frontend**: Vercel (automatic deployments from main branch)
- **Backend**: Convex Cloud (automatic deployments)
- **Domain**: TBD

### Environments
1. **Development**: Local development with Convex dev
2. **Staging**: Preview deployments on Vercel
3. **Production**: Main branch auto-deploy

### CI/CD Pipeline
- [ ] GitHub Actions for CI
- [ ] Run linting on PR
- [ ] Run type checking on PR
- [ ] Run tests on PR (when added)
- [ ] Automatic deployment on merge to main

---

## Timeline & Milestones

### Milestone 1: Foundation ✅ (Completed)
**Completed**: March 2026
- Authentication, Database, Basic UI, Project Management

### Milestone 2: Core Features ✅ (Completed - March 28, 2026)
**Completed**: March 28, 2026
- [x] Task board UI with Kanban and table views
- [x] Task CRUD operations with rich text editor
- [x] Task filtering, sorting, and drag-and-drop
- [x] Project settings UI (general, members, permissions, danger zone)
- [x] Member management with invite functionality
- [x] Resource management (files & links with folders)
- [x] File upload with drag-and-drop

### Milestone 3: Complete Auth & Collaboration (Target: 3-4 weeks)
**Target Date**: Late April 2026
- [ ] Email/password auth
- [ ] Google OAuth
- [ ] Group messaging system
- [ ] Task comments & discussions
- [ ] Notification system
- [ ] Public feedback submissions and integration endpoints

### Milestone 4: Public Features & Integrations (Target: 6 weeks)
**Target Date**: End of May 2026
- [x] Feedback system with voting
- [ ] Changelog management
- [x] Public feedback board
- [ ] Public changelog page
- [ ] Public feedback submission flow
- [ ] Public API/webhooks

### Milestone 5: Public Features (Target: 4 weeks)
**Target Date**: End of June 2026
- [ ] Changelog
- [ ] Public feedback board
- [ ] Embeddable widgets

### Milestone 6: Beta Launch
**Target Date**: July 2026
- [ ] All core features complete
- [ ] Testing complete
- [ ] Documentation complete
- [ ] Launch landing page

---

## Current Sprint (Week of April 1, 2026)

### Goals
1. ✅ Complete Task Board UI implementation
2. ✅ Implement Project Settings UI
3. ✅ Build Resource Management (Files & Links)
4. ✅ Add member management with invites
5. ✅ Ship feedback board and voting workflow

### Completed This Sprint
1. ✅ Task board with Kanban and table views
2. ✅ Drag-and-drop task status updates
3. ✅ Rich text editor integration
4. ✅ Project settings (general, members, permissions, danger zone)
5. ✅ File upload with drag-and-drop
6. ✅ Link management
7. ✅ Folder organization

### Next Sprint Tasks (Week of April 8, 2026)
**Focus**: Auth, collaboration, and public feedback
1. Implement email/password authentication
2. Add Google OAuth
3. Finish public feedback submissions and integration endpoints
4. Design notification system
5. Add task comments functionality

---

## Notes & Considerations

### Architecture Decisions
- **Why Client Components for project pages?**: Convex Auth context is passed via React Context, which requires Client Components for `useQuery` hooks
- **Why Convex over traditional backend?**: Real-time updates, type-safe queries, serverless scaling
- **Why shadcn/ui?**: Flexible components with full ownership, easy customization
- **Why Tiptap for rich text?**: Extensible, headless editor with React integration
- **Why @dnd-kit for drag-and-drop?**: Modern, accessible, framework-agnostic solution

### Future Considerations
- Consider adding Redis for caching (if needed)
- Evaluate WebSocket connections for real-time messaging
- Consider implementing service workers for offline support
- Plan for internationalization (i18n) in Phase 5

---

## Summary Statistics (as of April 2, 2026)

### Completion Status
| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Core Features | ✅ Complete | 100% |
| Phase 3: Collaboration | 🔄 In Progress | ~60% |
| Phase 4: Public Features | 🔮 Not Started | 0% |
| Phase 5: Advanced | 🔮 Not Started | 0% |
| **Overall Project** | **🔄 Active Development** | **~80%** |

### Features Implemented
- **Backend Functions**: 30+ Convex queries/mutations
- **UI Components**: 50+ custom components + shadcn/ui library
- **Pages**: 15+ pages across auth, dashboard, project, and settings
- **Authentication**: GitHub OAuth (email/password pending)
- **Database Tables**: 7 tables (users, projects, memberships, tasks, resources, folders + auth tables)
- **Collaboration**: Messaging, feedback, and comments foundation in place

### Key Achievements
✅ Full project lifecycle management  
✅ Complete task management with Kanban & table views  
✅ Rich text editing for task descriptions  
✅ File upload & link management with folders  
✅ Role-based access control  
✅ Real-time data synchronization via Convex  
✅ Responsive UI with dark mode support  
✅ Drag-and-drop interactions  

### Next Priority Items
1. Email/password authentication
2. Google OAuth integration
3. Public feedback submissions and integration endpoints
4. Notification system
5. Task comments & discussions
6. Changelog management
- Consider adding queue system for email notifications
- Consider WebSocket alternative for messaging (current: Convex subscriptions)
- Consider adding search engine (Algolia/Meilisearch) for global search

### Open Questions
- Should we support multiple teams per user? (Not in current plan)
- File upload limits per tier? (Suggest: Free=10MB, Pro=50MB)
- Maximum members per project? (Suggest: No limit for now)
- Should we add task time tracking? (Phase 5)

---

## Contributing

### How to Start Working on This Project

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd projectify-v2
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cd apps/web
   cp .env.example .env.local
   # Add your CONVEX_SITE_URL and other required variables
   ```

4. **Run Convex dev server**
   ```bash
   cd apps/web
   pnpm cdev
   ```

5. **Run Next.js dev server** (in another terminal)
   ```bash
   cd apps/web
   pnpm dev
   ```

6. **Pick a task from the plan** and start coding!

### Development Workflow
1. Create a feature branch from `main`
2. Make your changes
3. Run linting: `pnpm lint`
4. Run type checking: `pnpm typecheck`
5. Commit with descriptive message
6. Create PR with description
7. Wait for review and merge

---

**Document Maintained By**: Development Team  
**Review Frequency**: Weekly  
**Last Review**: April 2, 2026
