# PLAN.md - Projectify v2 Development Plan

**Last Updated**: March 24, 2026  
**Project Status**: Phase 1 Complete (Foundation), Phase 2 In Progress (Core Features - 65% Complete)

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

---

## Current Status

### 📊 Overall Progress: ~65% Complete

**What's Working**:
- ✅ Complete authentication system (GitHub OAuth)
- ✅ Full project CRUD with analytics
- ✅ Complete team/membership management backend
- ✅ Task management backend (create, update, delete, list)
- ✅ Task management UI (Kanban board, data table, dialogs)
- ✅ Rich text editor for task descriptions (Tiptap)
- ✅ Drag-and-drop task status updates
- ✅ User account management (profile, delete account)
- ✅ Project and user dashboards with analytics
- ✅ Role-based permissions system
- ✅ UI component library
- ✅ Route protection with proxy.ts

**What's Partially Done**:
- 🚧 Project Settings UI (backend ready, UI placeholder)

**What's Not Started**:
- ❌ Email/Password authentication
- ❌ Google OAuth authentication
- ❌ Resource management (files & links)
- ❌ Feedback system
- ❌ Changelog management
- ❌ Group messaging
- ❌ Team concept (multi-project teams)
- ❌ Notification system

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

### Phase 2: Core Features 🔄 (65% Complete)
**Current Phase - Estimated Duration**: 4-6 weeks  
**Priority**: HIGH

#### 2.1 Task Management UI ✅ (100% Complete)
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

#### 2.3 Project Settings UI (Not Started)
- [ ] Create project settings page structure
- [ ] Add general settings tab (name, description, icon)
- [ ] Add members tab with management UI
- [ ] Add permissions tab
- [ ] Add danger zone (delete project)
- [ ] Implement project icon upload
- [ ] Add project status management

**Files to Create**:
```
apps/web/app/project/[id]/settings/
├── page.tsx (replace placeholder)
└── components/
    ├── general-settings.tsx
    ├── member-management.tsx
    ├── permissions-settings.tsx
    └── danger-zone.tsx
```

#### 2.4 Member Management UI (Not Started)
- [ ] Create member list component
- [ ] Create invite member dialog
- [ ] Add member role badges
- [ ] Add role change dropdown (owner only)
- [ ] Add remove member confirmation
- [ ] Show member join date
- [ ] Display member activity

**Files to Create**:
```
apps/web/components/project/
├── member-list.tsx
├── member-card.tsx
├── invite-member-dialog.tsx
└── member-role-badge.tsx
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

### Phase 3: Collaboration Features 📋 (0% Complete)
**Estimated Duration**: 6-8 weeks  
**Priority**: MEDIUM

#### 3.1 Resource Management (Not Started)
- [ ] Design resource schema (files & links)
- [ ] Implement file upload to Convex storage
- [ ] Create backend functions (create, list, update, delete)
- [ ] Build resource list UI
- [ ] Create file upload dialog
- [ ] Create link add dialog
- [ ] Add resource categories/folders
- [ ] Implement resource search
- [ ] Add file preview functionality
- [ ] Add download functionality

**Database Schema**:
```typescript
resources: defineTable({
  projectId: v.id("projects"),
  type: v.union(v.literal("file"), v.literal("link")),
  name: v.string(),
  url: v.optional(v.string()), // For links
  storageId: v.optional(v.id("_storage")), // For files
  category: v.optional(v.string()),
  size: v.optional(v.number()),
  mimeType: v.optional(v.string()),
  uploadedBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

**Files to Create**:
- `apps/web/convex/resources.ts`
- `apps/web/app/project/[id]/resources/page.tsx`
- `apps/web/app/project/[id]/resources/components/resource-list.tsx`
- `apps/web/app/project/[id]/resources/components/upload-file-dialog.tsx`
- `apps/web/app/project/[id]/resources/components/add-link-dialog.tsx`

#### 3.2 Group Messaging (Not Started)
- [ ] Design messages schema with threading
- [ ] Create backend functions (send, list, update, delete)
- [ ] Build real-time message list
- [ ] Create message input component
- [ ] Implement message threading
- [ ] Add file attachments to messages
- [ ] Add message reactions
- [ ] Implement @mentions
- [ ] Add typing indicators
- [ ] Add message search
- [ ] Implement unread message counter

**Database Schema**:
```typescript
messages: defineTable({
  projectId: v.id("projects"),
  authorId: v.id("users"),
  content: v.string(),
  threadId: v.optional(v.id("messages")),
  attachments: v.optional(v.array(v.id("_storage"))),
  reactions: v.optional(v.object({})), // emoji: userId[]
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
})
```

**Files to Create**:
- `apps/web/convex/messages.ts`
- `apps/web/app/project/[id]/messages/page.tsx`
- `apps/web/app/project/[id]/messages/components/message-list.tsx`
- `apps/web/app/project/[id]/messages/components/message-item.tsx`
- `apps/web/app/project/[id]/messages/components/message-input.tsx`
- `apps/web/app/project/[id]/messages/components/message-thread.tsx`

#### 3.3 Feedback System (Not Started)
- [ ] Design feedback schema
- [ ] Create backend functions (create, list, update, vote)
- [ ] Build feedback board UI
- [ ] Create feedback submission form
- [ ] Implement voting system
- [ ] Add feedback comments
- [ ] Add feedback status workflow
- [ ] Create convert-to-task functionality
- [ ] Build public feedback board (for external users)
- [ ] Add feedback categories

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

### Milestone 2: Task Management (Target: 2 weeks)
**Target Date**: Early April 2026
- [ ] Task board UI
- [ ] Task CRUD operations
- [ ] Task filtering & search

### Milestone 3: Complete Auth & Settings (Target: 1 week)
**Target Date**: Mid April 2026
- [ ] Email/password auth
- [ ] Google OAuth
- [ ] Project settings UI
- [ ] Member management UI

### Milestone 4: Collaboration Features (Target: 6 weeks)
**Target Date**: End of May 2026
- [ ] Resource management
- [ ] Group messaging
- [ ] Feedback system
- [ ] Task comments

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

## Current Sprint (Week of March 21, 2026)

### Goals
1. ✅ Fix authentication context issue in project routes
2. ✅ Create PRD.md and PLAN.md
3. 🔄 Start Task Board UI implementation

### Next Sprint Tasks
1. Implement Task Board component with drag-and-drop
2. Create Task Card and Task Detail components
3. Build Create/Edit Task dialogs
4. Add task filtering and search

---

## Notes & Considerations

### Architecture Decisions
- **Why Client Components for project pages?**: Convex Auth context is passed via React Context, which requires Client Components for `useQuery` hooks
- **Why Convex over traditional backend?**: Real-time updates, type-safe queries, serverless scaling
- **Why shadcn/ui?**: Flexible components with full ownership, easy customization

### Future Considerations
- Consider adding Redis for caching (if needed)
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
**Last Review**: March 21, 2026
