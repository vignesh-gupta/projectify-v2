# Projectify CLI - Implementation Plan & Feature Status

## Scope
This file tracks CLI progress against `apps/cli/CLI-PRD.md` using the current implementation in `apps/cli/src/**` as source of truth.

## Status legend
- **Done**: Implemented and wired in CLI commands.
- **Partial**: Implemented but does not fully match PRD behavior/options.
- **Pending**: Required by PRD but not implemented yet.
- **Proposed**: Not required for parity; recommended enhancement.

## Current implementation snapshot
- Implemented command groups: `auth`, `config`, `projects`, `project`, `tasks`
- Missing PRD command groups: `feedback`, `changelog`, `resources`, `messages`
- Core supporting pieces present: config hierarchy (global/local), API client wrapper, prompt/spinner/table formatter utilities, JSON output mode.

## PRD coverage matrix

| Area | Command / Capability | Status | Notes |
| --- | --- | --- | --- |
| Auth | `auth login` | **Partial** | Login flow exists with API key validation and storage; PRD scope display is not implemented. |
| Auth | `auth logout` | **Done** | Supports local/global removal. |
| Auth | `auth status` | **Partial** | Validates and prints user; PRD-style scopes and config-source detail are missing. |
| Projects | `projects list` | **Done** | Status filter + limit + table/JSON output implemented. |
| Projects | `projects create` | **Partial** | Works in interactive/non-interactive mode; PRD mentions natural-language due date parsing, currently ISO/date parsing only. |
| Projects | `projects get <id>` | **Done** | Implemented with table or JSON output. |
| Projects | `projects update <id>` | **Done** | Implemented with partial-field updates (`title`, `description`, `status`, `dueDate`). |
| Projects | `projects delete <id>` | **Done** | Implemented with confirmation + `--force`. |
| Tasks | `tasks list` | **Done** | Implemented with project/status/priority/assignee/limit filters + table/JSON output. |
| Tasks | `tasks create` | **Done** | Implemented in interactive and non-interactive modes with assignee support. |
| Tasks | `tasks get <id>` | **Done** | Implemented. |
| Tasks | `tasks update <id>` | **Done** | Implemented with assignee updates and other partial-field updates. |
| Tasks | `tasks assign <id> <userId>` | **Done** | Implemented as explicit assignment command. |
| Tasks | `tasks delete <id>` | **Done** | Implemented with confirmation + `--force`. |
| Feedback | `feedback *` command set | **Done** | Implemented: `list`, `create`, `vote`. |
| Changelog | `changelog *` command set | **Done** | Implemented: `list`, `create`, `publish`. |
| Resources | `resources *` command set | **Done** | Implemented: `list`, `upload`, `add-link`. |
| Messages | `messages *` command set | **Done** | Implemented: `list`, `send`. |
| ID selectors | Missing required IDs fallback to interactive selector | **Done** | Added selector fallback for project/task/feedback/changelog IDs where context is available. |
| Config | `config set/get/list` | **Done** | Implemented with local/global support. |
| Global flags | `--json`, `--no-color`, `--project`, `--verbose` | **Done** | Declared globally and `--project` precedence is normalized for project-scoped task commands. |
| Error model | Auth/network/validation/resource friendly errors | **Partial** | Friendly mapping improved (scope/expired/invalid key, required fields, timeout, permission), with room for deeper backend-specific refinement. |
| Distribution | npm package + executable bin | **Done** | CLI package + bin entrypoint present. |
| Distribution | Standalone binaries (Win/macOS/Linux) | **Done** | Added `build:binaries` (pkg) to generate Windows/macOS/Linux binaries in `releases/`. |
| CI/CD release | Publish/release automation | **Done** | Added release workflow (`.github/workflows/cli-release.yml`) and release scripts. |
| Testing | Unit/integration/E2E coverage | **Pending** | No test suite configured for CLI commands. |

## Done features
1. CLI core command wiring with Commander.
2. Auth command flow (`login`, `logout`, `status`) with API validation.
3. Config system with global/local precedence.
4. Project operations (`list`, `create`, `get`, `update`, `delete`) and active-project selection (`projects`, `project use`).
5. Task operations (`list`, `create`, `get`, `update`, `assign`, `delete`) with assignee option support.
6. Feedback operations (`list`, `create`, `vote`) with filters and interactive create mode.
7. Changelog operations (`list`, `create`, `publish`) with draft publish workflow.
8. Resource operations (`list`, `upload`, `add-link`) including file upload flow.
9. Message operations (`list`, `send`) with optional thread replies.
10. UX helpers: colors, tables, prompts, spinners, JSON output.

## Pending features (for PRD parity)
1. CLI test coverage (unit/integration/E2E).

## Good-to-have features (Proposed)
1. Shell completion generation (`bash`, `zsh`, `fish`, PowerShell).
2. Bulk operations (`tasks update --all --status done`, mass delete with filters).
3. Structured automation output (`--output ndjson` and `--quiet` modes).
4. Retry/backoff and request timeout controls (`--timeout`, `--retries`).
5. Dry-run mode for mutating commands.
6. Task/project templates (`init project from template`, `task presets`).
7. Import/export workflows (CSV/JSON for tasks and feedback).
8. Command aliases for frequent workflows (`done`, `next`, `today` style shortcuts).
9. Optional telemetry with explicit opt-in and privacy-safe events.
10. Doctor command (`pjfy doctor`) for config/auth/connectivity diagnostics.

## Phased implementation roadmap

### Phase 1 - PRD parity for existing domains
- ✅ Add `projects update`.
- ✅ Add `tasks assign`.
- ✅ Add task assignee support in `list/create/update`.
- ✅ Normalize global `--project` handling across commands.
- ⏳ Tighten PRD-aligned error messaging coverage (partially improved; further refinement possible).

### Phase 2 - Extended PRD command groups
- ✅ Implemented `feedback` commands (`list/create/vote`).
- ✅ Implemented `changelog` commands (`list/create/publish`).
- ✅ Implemented `resources` commands (`list/upload/add-link`).
- ✅ Implemented `messages` commands (`list/send`).

### Phase 3 - Release hardening
- Add CLI-focused tests (unit + integration + smoke E2E).
- ✅ Add binary build pipeline for Win/macOS/Linux.
- ✅ Add release automation (versioning, npm publish, binary artifacts).
- Expand user docs with command examples and troubleshooting matrix.

### Phase 4 - Good-to-have enhancements
- Add top-priority proposed features based on user demand and maintenance cost.

## Risks and dependencies
- Backend API route/function parity must exist for every planned CLI command.
- Resource upload and messaging flows may require additional backend contract work.
- Binary distribution introduces cross-platform packaging/testing overhead.

