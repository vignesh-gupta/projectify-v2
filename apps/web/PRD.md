# Product Requirements Document (PRD)
## Projectify v2 - Project Management for Small Teams

---

## 1. Executive Summary

**Product Name:** Projectify v2  
**Version:** 2.0  
**Product Type:** Web-based Project Management Application  
**Target Users:** Small teams (2-10 members) working on multiple projects  
**Primary Goal:** Simplify project management for small teams without the complexity of enterprise tools

### Vision Statement
Projectify is a streamlined project management tool that enables small teams to efficiently manage multiple projects, track work items, share resources, gather feedback, and communicate—all in one intuitive interface.

---

## 2. Product Overview

### 2.1 Problem Statement
Small teams often struggle with:
- **Over-complexity**: Enterprise project management tools have too many features and steep learning curves
- **Scattered Information**: Resources, feedback, and communications spread across multiple tools
- **Poor Collaboration**: Difficulty tracking who's working on what and project progress
- **Limited Budgets**: Expensive per-seat pricing models don't fit small team budgets

### 2.2 Solution
Projectify provides a focused, affordable project management solution with:
- Simple project and task management
- Built-in resource management (files and links)
- Integrated feedback collection system
- Group messaging for team communication
- Public changelog for project transparency
- Real-time updates and collaboration

---

## 3. Target Audience

### Primary Users
- **Indie Developers** - Solo developers or small dev teams (2-5 people)
- **Startup Teams** - Early-stage startups with 3-10 team members
- **Freelance Teams** - Freelancers collaborating on client projects
- **Small Agencies** - Digital agencies managing multiple client projects

### User Personas

#### Persona 1: Alex - Indie Developer & Team Lead
- **Role:** Full-stack developer and project owner
- **Goals:** Track multiple side projects, manage small team contributions, keep stakeholders informed
- **Pain Points:** Needs simple tool without enterprise complexity, limited budget
- **Technical Level:** High

#### Persona 2: Sarah - Project Manager
- **Role:** Project coordinator for a 7-person startup
- **Goals:** Organize work items, track progress, facilitate team communication
- **Pain Points:** Team members work remotely, need centralized communication
- **Technical Level:** Medium

#### Persona 3: Mike - Freelance Designer
- **Role:** Designer collaborating with developers on projects
- **Goals:** Share design files, gather feedback, track project changes
- **Pain Points:** File sharing across tools, feedback scattered in emails/chats
- **Technical Level:** Low-Medium

---

## 4. Core Features & Requirements

### 4.1 Authentication & User Management

#### ✅ Completed
- [x] User registration and login
- [x] GitHub OAuth authentication
- [x] Session management with Convex Auth
- [x] User profile management
- [x] Theme toggle (Light/Dark/System)

#### 🔄 In Progress
- [ ] Email/Password authentication
- [ ] Google OAuth authentication

#### 📋 Planned
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] User profile picture uploads

---

### 4.2 Project Management

#### ✅ Completed
- [x] Create projects with title, description, status
- [x] Project status tracking (Development, Maintenance, Inactive)
- [x] Project due dates
- [x] Project icons (uploaded to Convex storage)
- [x] List all user projects
- [x] View project details
- [x] Project analytics dashboard with:
  - Task statistics (total, todo, in progress, done)
  - Priority distribution
  - Completion rate
  - Overdue tasks count
  - Team member count
- [x] Update project details
- [x] Role-based access control (Owner, Admin, Member)

#### 📋 Planned
- [ ] Project archiving
- [ ] Project templates
- [ ] Project duplication
- [ ] Project favoriting/starring
- [ ] Project search and filtering
- [ ] Project tags/categories
- [ ] Project activity timeline
- [ ] Project export (PDF/CSV)

---

### 4.3 Team & Membership Management

#### ✅ Completed
- [x] Add members to projects
- [x] Three role types: Owner, Admin, Member
- [x] Role-based permissions:
  - **Owner**: Full control, can change roles
  - **Admin**: Can manage project and members (except role changes)
  - **Member**: Can view and create tasks
- [x] View project members
- [x] Update member roles (owner only)
- [x] Remove members (self or admin/owner)
- [x] Membership verification for all project operations

#### 📋 Planned
- [ ] Invite members via email
- [ ] Invitation system with accept/decline
- [ ] Member permissions customization
- [ ] Member activity tracking
- [ ] Member profile view within project
- [ ] Bulk member management
- [ ] Team creation (separate from projects)

---

### 4.4 Task Management (Work Items)

#### ✅ Completed (Backend Ready)
- [x] Create tasks with:
  - Title and description
  - Status (Todo, In Progress, Done)
  - Priority (Low, Medium, High)
  - Due date
  - Assignee
- [x] List tasks by project
- [x] Filter tasks by status
- [x] Update task details
- [x] Delete tasks (creator or admin/owner)
- [x] Task assignment to team members
- [x] Track task creator
- [x] Task timestamps (created, updated)

#### 🚧 In Progress (UI Pending)
- [ ] Task list/board UI
- [ ] Task creation form
- [ ] Task detail view
- [ ] Task editing interface
- [ ] Task filtering and sorting UI
- [ ] Drag-and-drop task status changes

#### 📋 Planned
- [ ] Kanban board view
- [ ] List view with filters
- [ ] Task comments and discussions
- [ ] Task attachments
- [ ] Task labels/tags
- [ ] Task dependencies
- [ ] Subtasks/checklist items
- [ ] Task time tracking
- [ ] Task templates
- [ ] Bulk task operations
- [ ] Task search

---

### 4.5 Resource Management

#### 🚧 Placeholder Implemented
- [ ] Upload files to project
- [ ] Save links/bookmarks
- [ ] Organize resources in folders
- [ ] Resource categories/tags
- [ ] Resource search
- [ ] Resource previews
- [ ] Resource versioning
- [ ] Shared resource library

#### 📋 Technical Requirements
- [ ] File upload to Convex storage
- [ ] File size limits (define per plan)
- [ ] Supported file types
- [ ] Link metadata extraction
- [ ] Resource permissions per member
- [ ] Resource activity log

---

### 4.6 Feedback System

#### 🚧 Placeholder Implemented
- [ ] Create feedback entries
- [ ] Feedback categories (Bug, Feature, Improvement)
- [ ] Feedback status (New, Under Review, Planned, In Progress, Done, Rejected)
- [ ] Vote on feedback
- [ ] Comment on feedback
- [ ] Convert feedback to work items
- [ ] Public/Private feedback toggle
- [ ] Feedback board (public-facing)
- [ ] Feedback notifications

#### 📋 Technical Requirements
- [ ] Feedback schema in database
- [ ] Feedback voting system
- [ ] Feedback-to-task conversion logic
- [ ] Public API for feedback board widget
- [ ] Email notifications for feedback updates

---

### 4.7 Changelog

#### 🚧 Placeholder Implemented
- [ ] Create changelog entries
- [ ] Version numbering (semver)
- [ ] Entry categories (Added, Changed, Fixed, Removed)
- [ ] Markdown support for entries
- [ ] Publish/Draft status
- [ ] Public changelog page
- [ ] Embeddable changelog widget
- [ ] RSS feed for updates
- [ ] Email notifications for new releases

#### 📋 Technical Requirements
- [ ] Changelog schema in database
- [ ] Markdown parser
- [ ] Public HTTP endpoint for changelog
- [ ] Widget embed code generator
- [ ] Email notification system

---

### 4.8 Group Messaging

#### 🚧 Placeholder Implemented
- [ ] Project-wide group chat
- [ ] Real-time messaging
- [ ] Message threads/replies
- [ ] File sharing in chat
- [ ] Message reactions
- [ ] @mentions
- [ ] Message search
- [ ] Message history
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Message notifications

#### 📋 Technical Requirements
- [ ] Messages schema with threading
- [ ] Real-time subscriptions (Convex)
- [ ] Message pagination
- [ ] File upload integration
- [ ] Notification system
- [ ] Unread message counter

---

### 4.9 Project Settings

#### ✅ Partially Implemented
- [x] Settings page route created

#### 📋 Planned
- [ ] General settings (name, description, icon)
- [ ] Member management interface
- [ ] Project visibility (Public/Private)
- [ ] Danger zone (delete project)
- [ ] Integration settings
- [ ] Notification preferences
- [ ] Custom project fields

---

### 4.10 Dashboard & Analytics

#### ✅ Completed
- [x] Main dashboard showing all projects
- [x] Project cards with status, description
- [x] Quick actions (create project)
- [x] Project dashboard with analytics:
  - Task completion rate
  - Task status distribution
  - Priority distribution
  - Team size
  - Overdue tasks alert

#### 📋 Planned
- [ ] Personal task dashboard (my tasks across projects)
- [ ] Activity timeline
- [ ] Team productivity insights
- [ ] Project timeline/Gantt chart
- [ ] Custom reports
- [ ] Data export functionality

---

## 5. Technical Architecture

### 5.1 Technology Stack

#### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x (App Router) | React framework with SSR/SSG |
| **React** | 19.x | UI library |
| **TypeScript** | 5.9+ | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **shadcn/ui** | Latest | Component library (Radix UI + Tailwind) |
| **Lucide React** | Latest | Icon library |
| **Zustand** | Latest | State management (if needed) |

#### Backend & Database
| Technology | Purpose |
|------------|---------|
| **Convex** | Real-time database & serverless backend |
| **Convex Auth** | Authentication system (replaces Clerk) |
| **Convex Storage** | File storage for uploads |

#### Deployment & Infrastructure
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting with edge functions |
| **Convex Cloud** | Backend and database hosting |

#### Development Tools
| Tool | Purpose |
|------|---------|
| **Turborepo** | Monorepo build system |
| **pnpm** | Package manager |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **TypeScript** | Type checking |

### 5.2 Project Structure

```
projectify-v2/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── app/                # Next.js App Router
│       │   ├── (auth)/        # Auth routes (login, register)
│       │   ├── (main-dashboard)/ # Main dashboard routes
│       │   ├── project/[id]/  # Project-specific routes
│       │   └── page.tsx       # Landing page
│       ├── components/         # React components
│       ├── convex/            # Convex backend functions
│       │   ├── schema.ts      # Database schema
│       │   ├── auth.ts        # Auth functions
│       │   ├── projects.ts    # Project functions
│       │   ├── tasks.ts       # Task functions
│       │   └── memberships.ts # Membership functions
│       ├── hooks/             # Custom React hooks
│       └── lib/               # Utility functions
├── packages/
│   ├── ui/                    # Shared UI components (shadcn/ui)
│   ├── eslint-config/         # Shared ESLint configs
│   └── typescript-config/     # Shared TypeScript configs
└── [config files]
```

### 5.3 Database Schema

#### Tables

**users** (from authTables)
- Managed by Convex Auth
- Contains user authentication data

**projects**
```typescript
{
  _id: Id<"projects">
  title: string
  description: string
  status: "development" | "maintenance" | "inactive"
  dueDate?: number
  iconStorageId?: Id<"_storage">
  createdAt: number
  updatedAt: number
}
```

**memberships**
```typescript
{
  _id: Id<"memberships">
  projectId: Id<"projects">
  userId: Id<"users">
  role: "owner" | "admin" | "member"
  joinedAt: number
}
```

**tasks**
```typescript
{
  _id: Id<"tasks">
  projectId: Id<"projects">
  title: string
  description?: string
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  dueDate?: number
  assigneeUserId?: Id<"users">
  createdBy: Id<"users">
  createdAt: number
  updatedAt: number
}
```

#### Future Tables (Planned)

**resources**
```typescript
{
  _id: Id<"resources">
  projectId: Id<"projects">
  type: "file" | "link"
  name: string
  url?: string
  fileStorageId?: Id<"_storage">
  category?: string
  uploadedBy: Id<"users">
  createdAt: number
}
```

**feedback**
```typescript
{
  _id: Id<"feedback">
  projectId: Id<"projects">
  title: string
  description: string
  category: "bug" | "feature" | "improvement"
  status: "new" | "under_review" | "planned" | "in_progress" | "done" | "rejected"
  votes: number
  isPublic: boolean
  createdBy: Id<"users">
  createdAt: number
  updatedAt: number
}
```

**changelog**
```typescript
{
  _id: Id<"changelog">
  projectId: Id<"projects">
  version: string
  title: string
  description: string (markdown)
  category: "added" | "changed" | "fixed" | "removed"
  status: "draft" | "published"
  publishedAt?: number
  createdBy: Id<"users">
  createdAt: number
}
```

**messages**
```typescript
{
  _id: Id<"messages">
  projectId: Id<"projects">
  content: string
  authorId: Id<"users">
  threadId?: Id<"messages">
  attachments?: Array<Id<"_storage">>
  reactions?: Record<string, Id<"users">[]>
  createdAt: number
  updatedAt?: number
}
```

### 5.4 API Architecture

All backend logic is handled through Convex functions:

**Query Functions** (read data)
- `projects.list` - Get user's projects
- `projects.getProject` - Get single project
- `projects.getProjectAnalytics` - Get project stats
- `tasks.listByProject` - Get project tasks
- `memberships.listByProject` - Get project members

**Mutation Functions** (write data)
- `projects.create` - Create new project
- `projects.update` - Update project
- `tasks.create` - Create task
- `tasks.update` - Update task
- `tasks.remove` - Delete task
- `memberships.add` - Add member
- `memberships.updateRole` - Change member role
- `memberships.remove` - Remove member

**HTTP Endpoints** (public APIs)
- `/api/auth/*` - Auth endpoints (via Convex Auth)

---

## 6. User Flows

### 6.1 New User Onboarding
1. User visits landing page
2. Clicks "Sign up" or "Login with GitHub"
3. Completes authentication (GitHub OAuth)
4. Redirected to dashboard
5. Sees empty state with "Create Project" prompt
6. Creates first project
7. Views project dashboard

### 6.2 Creating and Managing Projects
1. User clicks "Create Project" from dashboard
2. Fills in project details (title, description, status, due date)
3. Optionally uploads project icon
4. Project is created, user becomes owner
5. Can view project dashboard with analytics
6. Can invite team members
7. Can create tasks
8. Can manage project settings

### 6.3 Task Management (Planned)
1. User navigates to "Work Items" in project
2. Views Kanban board or list view
3. Clicks "Create Task"
4. Fills in task details
5. Assigns to team member
6. Sets priority and due date
7. Task appears on board
8. Team members can update status via drag-drop
9. Comments and discussions happen on task

### 6.4 Team Collaboration (Planned)
1. Owner invites members via email
2. Members receive invitation
3. Accept and join project
4. Can view/create tasks based on role
5. Receive notifications for @mentions
6. Use group messaging for communication
7. Share files in resources section
8. Provide feedback via feedback board

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **Page Load Time**: < 2 seconds on 3G connection
- **Time to Interactive**: < 3 seconds
- **Real-time Updates**: < 500ms latency for Convex subscriptions
- **File Upload**: Support files up to 10MB (free tier), 50MB (paid)

### 7.2 Scalability
- Support 1000+ concurrent users
- Handle 10,000+ projects
- 100,000+ tasks across all projects
- Real-time updates with Convex's scaling

### 7.3 Security
- HTTPS only for all connections
- Secure authentication via Convex Auth
- Row-level security on all database operations
- Role-based access control (RBAC)
- Input validation and sanitization
- XSS and CSRF protection
- Regular security audits

### 7.4 Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (4.5:1 minimum)
- Focus indicators on interactive elements
- Semantic HTML structure
- ARIA labels where needed

### 7.5 Browser Support
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### 7.6 Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: 320px - 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px+
- Touch-friendly UI on mobile
- Optimized layouts for each screen size

---

## 8. Success Metrics

### 8.1 User Acquisition
- **Target**: 1,000 registered users in first 6 months
- **Target**: 100 DAU (Daily Active Users) within 3 months

### 8.2 User Engagement
- **Task Creation Rate**: Average 10 tasks per project per month
- **Session Duration**: Average 15+ minutes per session
- **Return Rate**: 60% of users return within 7 days

### 8.3 Feature Adoption
- **Projects Created**: 80% of users create at least 1 project
- **Team Collaboration**: 50% of projects have 2+ members
- **Feature Usage**: 70% of users use at least 3 core features

### 8.4 Performance Metrics
- **Page Load Speed**: 95% of page loads < 2s
- **Error Rate**: < 0.1% of requests fail
- **Uptime**: 99.9% availability

---

## 9. Roadmap & Priorities

### Phase 1: Foundation (Completed ✅)
- [x] Authentication system (Convex Auth with GitHub)
- [x] Project CRUD operations
- [x] Team & membership management
- [x] Basic dashboard
- [x] Project analytics
- [x] Database schema and backend functions

### Phase 2: Core Features (Current Priority 🔄)
- [ ] Task Management UI (Kanban + List view)
- [ ] Email/Password authentication
- [ ] Resource management
- [ ] Project settings interface
- [ ] User profile management
- [ ] Notification system (in-app)

### Phase 3: Collaboration (Next Up 📋)
- [ ] Group messaging
- [ ] Feedback system
- [ ] Task comments
- [ ] File attachments
- [ ] @mentions and notifications
- [ ] Activity timeline

### Phase 4: Public Features (Future 🔮)
- [ ] Changelog
- [ ] Public feedback board
- [ ] Embeddable widgets
- [ ] Public API
- [ ] Webhook integrations

### Phase 5: Advanced Features (Future 🔮)
- [ ] Advanced analytics
- [ ] Custom reports
- [ ] Project templates
- [ ] Integrations (GitHub, Slack, etc.)
- [ ] Mobile apps (React Native)

---

## 10. Constraints & Limitations

### Technical Constraints
- Convex free tier limitations (storage, function execution time)
- File upload size limits
- Real-time connection limits
- Vercel free tier limits

### Business Constraints
- Initial launch as free product (monetization later)
- Small development team (1-3 developers)
- Limited marketing budget
- Bootstrap/self-funded model

### Design Constraints
- Must work on mobile devices
- Dark mode support required
- Accessibility compliance required
- Performance budget: < 2s load time

---

## 11. Future Considerations

### Monetization Strategy (Post-MVP)
- **Free Tier**: Up to 3 projects, 5 members per project, 10MB storage
- **Pro Tier** ($10/user/month): Unlimited projects, members, 50MB file uploads
- **Business Tier** ($20/user/month): Priority support, advanced analytics, SSO

### Potential Integrations
- GitHub (code repository integration)
- Slack (notifications)
- Google Drive (file storage)
- Figma (design embeds)
- Linear (issue tracking sync)

### Platform Expansion
- Desktop apps (Electron)
- Mobile apps (React Native)
- CLI tool for developers
- VS Code extension

---

## 12. Open Questions & Decisions Needed

### Authentication
- ✅ **Decided**: Using Convex Auth (GitHub OAuth working)
- 🔄 **Pending**: Add email/password and Google OAuth

### Task System
- 🤔 **Decision Needed**: Should we support swimlanes in Kanban board?
- 🤔 **Decision Needed**: Maximum number of tasks per project?
- 🤔 **Decision Needed**: Task priority color coding scheme?

### Resource Management
- 🤔 **Decision Needed**: File size limits per tier?
- 🤔 **Decision Needed**: Supported file types?
- 🤔 **Decision Needed**: Folder structure depth limit?

### Messaging
- 🤔 **Decision Needed**: Should we support direct messages between users?
- 🤔 **Decision Needed**: Message retention policy?
- 🤔 **Decision Needed**: File sharing size limits in chat?

### Feedback System
- 🤔 **Decision Needed**: Allow anonymous feedback on public board?
- 🤔 **Decision Needed**: Voting weight system?
- 🤔 **Decision Needed**: Moderation tools needed?

---

## 13. Appendices

### A. Glossary
- **Project**: A container for work items, resources, and team members
- **Work Item/Task**: An actionable item within a project
- **Member**: A user with access to a specific project
- **Resource**: A file or link shared within a project
- **Feedback**: User-submitted suggestions or bug reports
- **Changelog**: A record of project changes and versions

### B. References
- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### C. Version History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-21 | AI Assistant | Initial PRD creation based on codebase analysis |

---

**Document Status**: Living Document  
**Last Updated**: March 21, 2026  
**Next Review Date**: April 1, 2026
