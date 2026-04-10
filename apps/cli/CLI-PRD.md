# Projectify CLI - Product Requirements Document

## Overview

**Product Name**: Projectify CLI  
**Package Name**: `@projectify/cli`  
**Command Name**: `pjfy`  
**Version**: 1.0.0  
**Target Users**: End users who want to manage their Projectify projects and tasks from the terminal

## Purpose

The Projectify CLI enables users to interact with their Projectify workspace from the command line, providing a fast and efficient alternative to the web interface for common operations like creating tasks, viewing projects, publishing changelogs, and managing feedback.

## Target Audience

- Developers who prefer terminal workflows
- Power users who want to automate Projectify operations
- Users integrating Projectify into their local development environment
- Teams using Projectify in CI/CD pipelines

## Goals

1. **Complete API Coverage**: Support all major Projectify resources (projects, tasks, feedback, changelog, resources, messages)
2. **Developer-Friendly UX**: Rich formatting, colors, spinners, interactive prompts, and helpful error messages
3. **Flexible Authentication**: Secure API key-based authentication with support for multiple configurations
4. **Easy Distribution**: Available via npm and as standalone binaries
5. **Consistent Design**: Follow CLI best practices and maintain consistency with web app terminology

## Non-Goals

- Real-time features (watch mode, live updates) - CLI focuses on one-time commands
- Web app replacement - CLI complements, not replaces the web interface
- Admin/DevOps tooling - CLI is for end users, not system administrators
- Offline mode - CLI requires internet connection to communicate with Convex backend

## Technical Architecture

### Stack

- **Language**: TypeScript 5.9
- **Build Tool**: tsup (for fast bundling)
- **CLI Framework**: Commander.js
- **UI Libraries**: chalk (colors), ora (spinners), inquirer (prompts), cli-table3 (tables)
- **Config Management**: conf (for global/local config)
- **Backend**: Convex client to call existing Convex functions
- **Package Manager**: pnpm (monorepo consistency)

### Configuration System

**Config File Locations**:
- **Global**: `~/.projectify/config.json` (user-wide settings)
- **Local**: `.projectify/config.json` (project-specific settings)

**Config Hierarchy**: Local config overrides global config

**Config Schema**:
```json
{
  "apiKey": "uk_xxxxx...",
  "convexUrl": "https://your-deployment.convex.cloud",
  "defaultProject": "project-id-123",
  "outputFormat": "table" | "json",
  "noColor": false
}
```

### Authentication Flow

1. User runs `pjfy auth login`
2. CLI displays message: "Visit https://app.projectify.com/settings/api-keys to generate an API key"
3. CLI prompts: "Paste your API key:"
4. User pastes API key from web app
5. CLI validates key by calling Convex `authenticateUserApiKey` action
6. If valid, CLI stores key in config file (global by default, or local with `--local` flag)
7. User can run `pjfy auth status` to check authentication state
8. User can run `pjfy auth logout` to remove stored API key

### Command Structure

**Pattern**: `pjfy <resource> <action> [options]`

**Global Options** (available for all commands):
- `--json`: Output in JSON format
- `--no-color`: Disable colored output
- `--project <id>`: Specify project context
- `--verbose`: Show detailed output
- `--help`: Show help for command

## Feature Requirements

### 1. Authentication Commands

#### `pjfy auth login`

**Description**: Authenticate the CLI with Projectify

**Options**:
- `--local`: Store API key in local config instead of global

**Flow**:
1. Prompt user to visit web app and generate API key
2. Accept API key input (hidden/masked)
3. Validate API key by calling Convex backend
4. Store key in config file
5. Display success message with user info and scopes

**Example**:
```bash
$ pjfy auth login
Visit https://app.projectify.com/settings/api-keys to generate an API key.
? Paste your API key: ••••••••••••••••
✓ Authenticated as John Doe (john@example.com)
✓ API key saved to ~/.projectify/config.json
```

#### `pjfy auth logout`

**Description**: Remove stored API key

**Options**:
- `--local`: Remove from local config only
- `--global`: Remove from global config only

**Example**:
```bash
$ pjfy auth logout
✓ API key removed from ~/.projectify/config.json
```

#### `pjfy auth status`

**Description**: Show current authentication status

**Example**:
```bash
$ pjfy auth status
✓ Authenticated
User: John Doe (john@example.com)
Scopes: projects:read, projects:write, tasks:read, tasks:write
Config: ~/.projectify/config.json
```

### 2. Projects Commands

#### `pjfy projects list`

**Description**: List all projects

**Aliases**: `pjfy projects ls`, `pjfy projects`

**Options**:
- `--status <status>`: Filter by status (development/maintenance/inactive)
- `--limit <n>`: Limit number of results (default: 50)

**Output (table)**:
```
ID                   Title                Status        Due Date
──────────────────── ──────────────────── ──────────── ────────────
abc123               Website Redesign     development   2026-05-01
def456               Mobile App           maintenance   -
```

**Output (JSON)**:
```json
[
  {
    "_id": "abc123",
    "title": "Website Redesign",
    "description": "...",
    "status": "development",
    "dueDate": 1735689600000
  }
]
```

#### `pjfy projects create`

**Description**: Create a new project

**Options**:
- `--title <title>`: Project title (required if not interactive)
- `--description <desc>`: Project description (required if not interactive)
- `--status <status>`: Status (development/maintenance/inactive, default: development)
- `--due-date <date>`: Due date (ISO 8601 format or natural language)
- `--interactive`: Use interactive prompts

**Example (non-interactive)**:
```bash
$ pjfy projects create --title "New App" --description "Build a new app" --status development
✓ Project created: New App (id: xyz789)
```

**Example (interactive)**:
```bash
$ pjfy projects create --interactive
? Project title: New App
? Description: Build a new app
? Status: (Use arrow keys)
  ❯ development
    maintenance
    inactive
? Due date (optional): 2026-06-01
✓ Project created: New App (id: xyz789)
```

#### `pjfy projects get <id>`

**Description**: Get project details

**Example**:
```bash
$ pjfy projects get abc123
Title:       Website Redesign
Description: Complete redesign of the company website
Status:      development
Due Date:    2026-05-01
Created:     2026-01-15
```

#### `pjfy projects update <id>`

**Description**: Update a project

**Options**:
- `--title <title>`: New title
- `--description <desc>`: New description
- `--status <status>`: New status
- `--due-date <date>`: New due date

**Example**:
```bash
$ pjfy projects update abc123 --status maintenance
✓ Project updated: Website Redesign
```

#### `pjfy projects delete <id>`

**Description**: Delete a project

**Options**:
- `--force`: Skip confirmation prompt

**Example**:
```bash
$ pjfy projects delete abc123
? Are you sure you want to delete "Website Redesign"? (y/N) y
✓ Project deleted
```

### 3. Tasks Commands

#### `pjfy tasks list`

**Description**: List tasks

**Aliases**: `pjfy tasks ls`, `pjfy tasks`

**Options**:
- `--project <id>`: Filter by project (required if no default project set)
- `--status <status>`: Filter by status (todo/in_progress/done)
- `--priority <priority>`: Filter by priority (low/medium/high)
- `--assignee <userId>`: Filter by assignee
- `--limit <n>`: Limit number of results (default: 50)

**Example**:
```bash
$ pjfy tasks list --project abc123 --status todo
ID       Title                   Priority  Assignee     Due Date
──────── ─────────────────────── ───────── ──────────── ──────────
t1       Fix login bug           high      John Doe     2026-04-10
t2       Add dark mode           medium    -            -
```

#### `pjfy tasks create`

**Description**: Create a new task

**Options**:
- `--project <id>`: Project ID (required if no default project)
- `--title <title>`: Task title (required if not interactive)
- `--description <desc>`: Task description
- `--status <status>`: Status (default: todo)
- `--priority <priority>`: Priority (default: medium)
- `--assignee <userId>`: Assign to user
- `--due-date <date>`: Due date
- `--interactive`: Use interactive prompts

**Example**:
```bash
$ pjfy tasks create --project abc123 --title "Fix login bug" --priority high
✓ Task created: Fix login bug (id: t1)
```

#### `pjfy tasks get <id>`

**Description**: Get task details

**Example**:
```bash
$ pjfy tasks get t1
Title:       Fix login bug
Description: Users can't log in with email
Status:      todo
Priority:    high
Assignee:    John Doe
Due Date:    2026-04-10
Created:     2026-04-01
```

#### `pjfy tasks update <id>`

**Description**: Update a task

**Options**:
- `--title <title>`: New title
- `--description <desc>`: New description
- `--status <status>`: New status
- `--priority <priority>`: New priority
- `--assignee <userId>`: New assignee
- `--due-date <date>`: New due date

**Example**:
```bash
$ pjfy tasks update t1 --status in_progress
✓ Task updated: Fix login bug
```

#### `pjfy tasks assign <id> <userId>`

**Description**: Assign task to a user

**Example**:
```bash
$ pjfy tasks assign t1 user123
✓ Task assigned to John Doe
```

#### `pjfy tasks delete <id>`

**Description**: Delete a task

**Example**:
```bash
$ pjfy tasks delete t1
? Are you sure you want to delete "Fix login bug"? (y/N) y
✓ Task deleted
```

### 4. Feedback Commands

#### `pjfy feedback list`

**Description**: List feedback items

**Options**:
- `--project <id>`: Filter by project
- `--category <category>`: Filter by category (bug/feature/improvement)
- `--status <status>`: Filter by status (new/under_review/planned/in_progress/done/rejected)
- `--limit <n>`: Limit results

**Example**:
```bash
$ pjfy feedback list --project abc123 --category bug
ID      Title                    Category  Status  Votes
─────── ──────────────────────── ───────── ─────── ─────
f1      Login page broken        bug       new     5
```

#### `pjfy feedback create`

**Description**: Create feedback

**Options**:
- `--project <id>`: Project ID
- `--title <title>`: Title
- `--description <desc>`: Description
- `--category <category>`: Category (bug/feature/improvement)
- `--interactive`: Interactive mode

#### `pjfy feedback vote <id>`

**Description**: Vote on feedback

**Example**:
```bash
$ pjfy feedback vote f1
✓ Vote added
```

### 5. Changelog Commands

#### `pjfy changelog list`

**Description**: List changelog entries

**Options**:
- `--project <id>`: Filter by project
- `--status <status>`: Filter by status (draft/published)
- `--limit <n>`: Limit results

#### `pjfy changelog create`

**Description**: Create changelog entry

**Options**:
- `--project <id>`: Project ID
- `--version <version>`: Version number
- `--title <title>`: Title
- `--content <content>`: Content (markdown/HTML)
- `--interactive`: Interactive mode

#### `pjfy changelog publish <id>`

**Description**: Publish a changelog entry

**Example**:
```bash
$ pjfy changelog publish cl1
✓ Changelog published: v1.2.0
```

### 6. Resources Commands

#### `pjfy resources list`

**Description**: List resources (files/links)

**Options**:
- `--project <id>`: Filter by project
- `--type <type>`: Filter by type (file/link)
- `--folder <folderId>`: Filter by folder

#### `pjfy resources upload <path>`

**Description**: Upload a file resource

**Options**:
- `--project <id>`: Project ID
- `--name <name>`: Resource name
- `--folder <folderId>`: Folder to upload to

**Example**:
```bash
$ pjfy resources upload ./design.pdf --project abc123
Uploading design.pdf... ━━━━━━━━━━━━━━━━ 100%
✓ File uploaded: design.pdf
```

#### `pjfy resources add-link`

**Description**: Add a link resource

**Options**:
- `--project <id>`: Project ID
- `--name <name>`: Link name
- `--url <url>`: URL
- `--folder <folderId>`: Folder

**Example**:
```bash
$ pjfy resources add-link --project abc123 --name "Figma Design" --url "https://figma.com/..."
✓ Link added: Figma Design
```

### 7. Messages Commands

#### `pjfy messages list`

**Description**: List recent messages

**Options**:
- `--project <id>`: Filter by project
- `--limit <n>`: Limit results (default: 20)

#### `pjfy messages send`

**Description**: Send a message

**Options**:
- `--project <id>`: Project ID
- `--content <content>`: Message content
- `--thread <messageId>`: Reply to thread

**Example**:
```bash
$ pjfy messages send --project abc123 --content "Meeting at 3pm"
✓ Message sent
```

### 8. Configuration Commands

#### `pjfy config set <key> <value>`

**Description**: Set a config value

**Options**:
- `--local`: Set in local config
- `--global`: Set in global config (default)

**Example**:
```bash
$ pjfy config set defaultProject abc123
✓ Config updated
```

#### `pjfy config get <key>`

**Description**: Get a config value

**Example**:
```bash
$ pjfy config get defaultProject
abc123
```

#### `pjfy config list`

**Description**: List all config values

**Example**:
```bash
$ pjfy config list
apiKey:         uk_xxxxx...yyyy
convexUrl:      https://your-deployment.convex.cloud
defaultProject: abc123
outputFormat:   table
```

## Error Handling

### Authentication Errors

- **No API key**: Show message: "Not authenticated. Run `pjfy auth login` to authenticate."
- **Invalid API key**: Show message: "Invalid API key. Run `pjfy auth login` to re-authenticate."
- **Expired API key**: Show message: "API key expired. Run `pjfy auth login` to re-authenticate."
- **Insufficient scopes**: Show message: "API key does not have required scope: {scope}. Please generate a new key with the required scopes."

### Network Errors

- **Connection failed**: Show message: "Failed to connect to Convex. Check your internet connection."
- **Timeout**: Show message: "Request timed out. Please try again."

### Validation Errors

- **Missing required field**: Show message: "Missing required option: --{field}"
- **Invalid value**: Show message: "Invalid value for --{field}: {value}"

### Resource Errors

- **Not found**: Show message: "{Resource} not found: {id}"
- **Unauthorized**: Show message: "You don't have permission to access this {resource}"

## Installation & Distribution

### NPM Package

**Installation**:
```bash
npm install -g @projectify/cli
# or
pnpm add -g @projectify/cli
```

**Package Structure**:
- Entry point: `bin/pjfy.js` (shebang script)
- Compiled code: `dist/` (tsup output)
- Dependencies: Bundled or external based on size optimization

### Binary Distribution

**Platforms**:
- Linux (x64, arm64)
- macOS (x64, arm64)
- Windows (x64)

**Build Tool**: pkg or similar for creating standalone executables

**Distribution**: GitHub Releases with downloadable binaries

## Success Metrics

1. **Adoption**: 100+ active CLI users in first month
2. **Coverage**: 80%+ of common web app operations available via CLI
3. **Performance**: Commands execute in <2 seconds (excluding network latency)
4. **Reliability**: <1% error rate (excluding user input errors)
5. **User Satisfaction**: Positive feedback from beta testers

## Future Enhancements (Out of Scope for v1.0)

- Real-time watch mode (`pjfy tasks watch`)
- Shell autocompletion (bash, zsh, fish)
- Plugin system for custom commands
- Bulk operations (`pjfy tasks update --status done --all`)
- Templates for common workflows
- Offline mode with sync
- Integration with other CLIs (git hooks, etc.)

## Dependencies

### Required Backend Changes

- Add HTTP endpoint for API key validation (if not already exposed)
- Ensure all Convex functions are accessible via Convex client
- Add CORS configuration if needed for CLI requests

### Required Documentation

- CLI installation guide in README
- API key generation guide in web app
- Command reference documentation
- Troubleshooting guide

## Timeline

- **Phase 1** (Week 1-2): Project setup, authentication, config system
- **Phase 2** (Week 3-4): Projects and tasks commands
- **Phase 3** (Week 5-6): Feedback, changelog, resources, messages
- **Phase 4** (Week 7): Polish, testing, documentation
- **Phase 5** (Week 8): CI/CD, release, binary builds

## Sign-off

This PRD outlines the requirements for the Projectify CLI v1.0. Approval from stakeholders is required before implementation begins.
