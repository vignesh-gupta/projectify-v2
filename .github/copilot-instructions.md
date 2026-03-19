# Copilot Instructions for Projectify

## Project Overview

Projectify is a modern project management tool for small teams. It's a **monorepo** using Turborepo with:
- **apps/web**: Next.js 16 frontend application
- **packages/ui**: Shared UI component library (using shadcn/ui)
- **packages/eslint-config**: Shared ESLint configuration
- **packages/typescript-config**: Shared TypeScript configuration

The backend is **Convex** (real-time database), and the frontend uses **Convex Auth** for authentication.

## Architecture

### Technology Stack
- **Frontend**: Next.js 16 (React 19) with App Router, Tailwind CSS v4, shadcn/ui components
- **Backend/Database**: Convex (serverless backend with real-time database)
- **Auth**:  convex-auth for auth
- **State Management**: Zustand (if used)
- **UI Framework**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Icons**: Lucide React
- **Code Quality**: ESLint 9, Prettier, TypeScript 5.9

### Data Model (Convex Schema)
The main entities are:
- **users**: Handled by authTables (from @convex-dev/auth)
- **projects**: Project records with title, description, status (development/maintenance/inactive), dueDate, optional icon
- **memberships**: Links users to projects with roles (owner/admin/member)
- **tasks**: Work items with projectId, title, description, status (todo/in_progress/done), priority (low/medium/high), optional dueDate and assigneeUserId

Key indexing: projects (by_status, by_due_date), memberships (by_project, by_user, by_project_user), tasks (by_project, by_status, by_assignee)

### Directory Structure
```
apps/web/
├── app/                    # Next.js App Router pages and layouts
├── components/             # App-specific components
├── convex/                 # Convex backend functions and schema
│   ├── schema.ts          # Database schema definition
│   ├── auth.config.ts     # auth configuration
│   └── http.ts            # HTTP endpoints (if any)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and helpers
└── public/                 # Static assets

packages/ui/
├── src/components/        # Reusable UI components (shadcn/ui)
├── src/hooks/            # Shared custom hooks
├── src/lib/              # Shared utilities
└── src/styles/           # Global styles

packages/eslint-config/   # ESLint configs for different contexts
packages/typescript-config/ # TypeScript configs for different targets
```

## Build, Test, and Lint Commands

### Root Workspace Commands
Run from the project root (`projectify-v2/`):

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm dev --filter=web # Start only the web app

# Building
pnpm build            # Build all packages and apps

# Code Quality
pnpm lint             # Run ESLint across workspace
pnpm format           # Format code with Prettier
pnpm typecheck        # TypeScript type checking across workspace
```

### Web App Specific Commands
Run from `apps/web/`:

```bash
# Development
pnpm dev              # Start Next.js dev server with Turbopack
pnpm cdev             # Start Convex dev server (convex dev)
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format TypeScript/TSX files
pnpm typecheck        # TypeScript type check without emitting

# Building
pnpm build            # Build Next.js app for production
```

### Running Tests
There are currently no test commands configured. Tests would be added at the workspace root (`pnpm test`) or per-package as needed.

### Running a Single File/Component
- **Lint a single file**: `cd apps/web && pnpm lint path/to/file.tsx`
- **Type-check only**: `cd apps/web && pnpm typecheck`
- **Format a file**: `pnpm format "apps/web/path/to/file.tsx"`

## Key Conventions

### TypeScript & Naming
- Use **camelCase** for variables, functions, and props
- Use **PascalCase** for React components and types
- Use `v.string()`, `v.number()`, etc. from `convex/values` in schema.ts for type definitions
- Always explicitly type function return values and parameters

### Convex Backend
- Database functions live in `apps/web/convex/`
- Schema is defined as a single object with `defineTable` for each table
- Use `.index()` chaining to define indexes for performance
- Authentication context is available through Convex's built-in auth system (see `auth.config.ts`)
- Export schema as `export default schema`

### Component Structure
- Place shared UI components in `packages/ui/src/components/`
- App-specific components go in `apps/web/components/`
- shadcn/ui components use Radix UI primitives with Tailwind styling
- Use `clsx` or `tailwind-merge` for conditional Tailwind classes

### Styling
- **Tailwind CSS v4**: Use utility-first approach; avoid inline styles
- **Class merging**: Import and use `tailwind-merge` when overriding Tailwind classes
- **Dark mode**: Next-themes handles dark mode with Tailwind's dark: prefix
- Configure Tailwind in each package's `postcss.config.mjs` (for ui package) and web app's `next.config.mjs`

### Code Formatting
- **Prettier** is configured with `prettier-plugin-tailwindcss` to auto-sort Tailwind classes
- Run `pnpm format` before committing
- ESLint rules from `@workspace/eslint-config` are enforced

### File Organization
- Keep component files small and focused
- Place utility functions in `lib/` directories
- Custom hooks go in `hooks/` directories
- Index files are not required but can be used for cleaner imports

### Environment & Secrets
- Environment variables are loaded from `.env.local` in the web app
- `CONVEX_SITE_URL` is required for building (set in turbo.json)
- Never commit `.env.local`; use `.env.example` for documentation

### Dependency Management
- Use `pnpm` for package management (configured in `package.json` with `"packageManager": "pnpm@9.0.6"`)
- Node >=20 is required
- Workspace packages are referenced with `"workspace:*"` syntax
- Internal packages use `@workspace/` naming (e.g., `@workspace/ui`)

## Common Tasks

### Adding a New Component
1. Create the component in `packages/ui/src/components/ComponentName.tsx`
2. Export it from `packages/ui/package.json` exports if it's meant for reuse
3. Import and use in `apps/web/components/` or other packages

### Modifying the Database Schema
1. Edit `apps/web/convex/schema.ts`
2. Add table definitions or modify existing ones
3. The types are automatically generated to `convex/_generated/`
4. Queries/mutations using the schema will auto-complete

### Adding Environment Variables
1. Add to `apps/web/.env.local` (never commit)
2. Document in `.env.example` or `.env.local.example`
3. If needed at build time, add to `turbo.json` env array

### Running Convex Locally
- Run `pnpm cdev` in `apps/web/` to start the local Convex development server
- This enables hot-reloading for backend functions

## MCP Servers

### Playwright (Web Testing)
For testing the web application with Playwright:

```bash
# Install Playwright (if not already installed)
pnpm add -D @playwright/test

# Run tests
pnpm exec playwright test

# Run tests in UI mode
pnpm exec playwright test --ui

# Run tests in debug mode
pnpm exec playwright test --debug
```

When making changes to UI components or page layouts, use Playwright to verify the changes don't break existing functionality. Consider adding E2E tests for critical user flows like project creation, task management, and team collaboration features.