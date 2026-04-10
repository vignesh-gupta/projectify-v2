# PLAN.md - Projectify v2 Development Plan

**Last Updated**: April 4, 2026  
**Project Status**: Phase 1 Complete, Phase 2 Complete, Phase 3 Complete, Phase 4 In Progress

---

## Project Snapshot

**Project Name**: Projectify v2  
**Description**: Modern project management tool for small teams  
**Tech Stack**: Next.js 16, React 19, TypeScript, Convex, Tailwind CSS v4, shadcn/ui  
**Architecture**: Monorepo with Turborepo

### Overall Progress

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | Complete | 100% |
| Phase 2: Core Features | Complete | 100% |
| Phase 3: Collaboration | Complete | 100% |
| Phase 4: Public Features & Integrations | In Progress | ~75% |
| Phase 5: Advanced Features | Not Started | 0% |
| **Overall Project** | **Active Development** | **~88%** |

### What Is Confirmed Working

- [x] GitHub OAuth authentication
- [x] Project CRUD, analytics, memberships, and role-based permissions
- [x] Task management UI with Kanban, table view, drag-and-drop, rich text, comments, and attachments
- [x] Project settings, member management, and account settings
- [x] Resource management with files, links, folders, uploads, and shared file preview
- [x] Real-time messaging with threads, mentions, reactions, attachments, typing indicator, and search
- [x] Notifications backend and notification dropdown UI
- [x] Feedback system with internal board, public board, voting, comments, convert-to-task, and public submission flow
- [x] Changelog schema, Convex backend, management workspace, public changelog page, RSS feed, API keys, and webhooks

### Current Gaps

- [ ] Email/password authentication
- [ ] Google OAuth authentication
- [ ] Changelog markdown authoring
- [ ] Embeddable changelog widget
- [ ] Release email notifications
- [ ] Third-party integrations (GitHub, Slack, Discord, email)
- [ ] Automated test coverage and CI pipeline
- [ ] Cross-cutting polish for loading, error, accessibility, and performance

---

## Phase Status

### Phase 1: Foundation

- [x] Monorepo, Next.js, TypeScript, Tailwind, Convex, shared packages
- [x] Convex Auth integration and protected routing
- [x] Base schema for users, projects, memberships, and tasks

### Phase 2: Core Features

- [x] Dashboard, project views, and settings
- [x] Task CRUD, Kanban/table views, drag-and-drop, and rich text editor
- [x] Resource management and member management UI
- [x] Notification system

### Phase 3: Collaboration

- [x] Messaging system
- [x] Feedback system
- [x] Task comments and task attachments

### Phase 4: Public Features & Integrations

- [x] Public feedback board and public feedback submissions
- [x] Changelog management workspace
- [x] Public changelog page and RSS feed
- [x] Public changelog API, API keys, webhooks, and delivery tracking
- [ ] Changelog markdown authoring
- [ ] Embeddable changelog widget
- [ ] Release email notifications
- [ ] Third-party integrations

### Phase 5: Advanced Features

- [ ] Team / multi-project workspace model
- [ ] Advanced analytics
- [ ] Project templates
- [ ] Mobile apps

---

## Pending Items

| Priority | Item | Scope | Estimate |
|----------|------|-------|----------|
| P0 | Email/password auth | Provider setup, auth flows, verification, reset flow, UI updates, testing | 4-6 days |
| P0 | Google OAuth | Provider config, auth UI update, callback testing | 1-2 days |
| P1 | Release email notifications | Trigger on changelog publish, email template, provider wiring, retry/error handling | 2-4 days |
| P1 | Changelog markdown authoring | Markdown editor or conversion flow, rendering, migration decision | 2-3 days |
| P1 | Embeddable changelog widget | Read-only embed endpoint/widget script and styling constraints | 2-4 days |
| P2 | CI + automated tests baseline | Playwright or integration baseline, lint/typecheck in CI, a few critical-path tests | 3-5 days |
| P2 | Loading/error/accessibility polish | Route-level loading and error coverage, keyboard flows, ARIA cleanup | 2-4 days |
| P3 | GitHub integration | Repo linking and issue sync design + first implementation slice | 4-6 days |
| P3 | Slack integration | Outbound notifications for project/changelog events | 2-3 days |
| P3 | Discord integration | Outbound notifications for project/changelog events | 2-3 days |
| P3 | Email integration beyond changelog | General notification/email channel design | 3-5 days |
| P4 | Team concept | Multi-project workspace model and permissions redesign | 1-2 weeks |
| P4 | Advanced analytics | Time tracking, burndown, velocity, exports | 1-2 weeks |
| P4 | Project templates | Template creation, seed flows, template library | 4-6 days |
| P5 | Mobile apps | React Native setup and product scoping | 2-4 weeks |

---

## Recommended Next Sequence

1. Ship `email/password auth`
2. Ship `Google OAuth`
3. Finish `release email notifications`
4. Finish `changelog markdown authoring`
5. Add `CI + automated tests baseline`

This sequence closes the remaining core product gaps first, then improves public-release workflows, then reduces regression risk.

---

## Notes

- This plan reflects the current repository state on April 4, 2026, including local changelog work already present in the working tree.
- Changelog currently stores and renders HTML content from the rich text editor, not markdown.
- Feedback public submission flow and notification UI are already implemented, so they are no longer listed as pending.
