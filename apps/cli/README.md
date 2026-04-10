# Projectify CLI (`pjfy`)

Command-line interface for Projectify - Manage your projects and tasks from the terminal.

## Installation

### From npm (when published)

```bash
npm install -g @projectify/cli
# or
pnpm add -g @projectify/cli
```

### From source

```bash
cd apps/cli
pnpm install
pnpm build
npm link
```

## Quick Start

```bash
# Authenticate
pjfy auth login

# Set your API base URL
pjfy config set baseUrl http://localhost:3000

# Set a default project
pjfy projects

# Or set by id
pjfy project use <project-id>

# List projects
pjfy projects list

# Create a project (interactive mode)
pjfy projects create --interactive

# List tasks
pjfy tasks list

# Create a task (interactive mode)
pjfy tasks create --interactive
```

## Commands

### Authentication

```bash
# Login and store API key
pjfy auth login [--local]

# Check authentication status
pjfy auth status

# Logout
pjfy auth logout [--local|--global]
```

### Configuration

```bash
# Set a config value
pjfy config set <key> <value> [--local|--global]

# Get a config value
pjfy config get <key>

# List all config
pjfy config list
```

**Available config keys:**
- `apiKey` - Your Projectify API key
- `baseUrl` - Base URL for Projectify API routes
- `defaultProject` - Default project ID for tasks
- `outputFormat` - Output format (table/json)
- `noColor` - Disable colors (true/false)

### Projects

```bash
# List all projects
pjfy projects list [--status <status>] [--limit <n>] [--json]

# Select and save default project
pjfy projects

# Set default project directly by ID
pjfy project use <id>

# Create a project
pjfy projects create --title "My Project" --description "Description" [--status development] [--due-date 2026-12-31]
pjfy projects create --interactive

# Get project details
pjfy projects get <id> [--json]

# Delete a project
pjfy projects delete <id> [--force]
```

### Tasks

```bash
# List tasks
pjfy tasks list --project <id> [--status <status>] [--priority <priority>] [--limit <n>] [--json]

# Create a task
pjfy tasks create --project <id> --title "Fix bug" [--description "..."] [--status todo] [--priority medium] [--due-date 2026-04-10]
pjfy tasks create --project <id> --interactive

# Get task details
pjfy tasks get <id> [--json]

# Update a task
pjfy tasks update <id> [--title "..."] [--status done] [--priority high]

# Delete a task
pjfy tasks delete <id> [--force]
```

## Global Options

Available for all commands:

- `--json` - Output in JSON format
- `--no-color` - Disable colored output
- `--project <id>` - Specify project context
- `--verbose` - Show detailed output

## Configuration Files

The CLI supports both global and local configuration:

- **Global**: `~/.projectify/config.json` - User-wide settings
- **Local**: `.projectify/config.json` - Project-specific settings (overrides global)

Local config takes precedence over global config.

## Examples

### Workflow Example

```bash
# 1. Login
pjfy auth login

# 2. Configure
pjfy config set baseUrl https://my-app.example.com
pjfy config set defaultProject proj_123

# 3. Create a project
pjfy projects create --interactive

# 4. List projects
pjfy projects list

# 5. Create tasks
pjfy tasks create --interactive
pjfy tasks create --title "Implement feature X" --priority high

# 6. Check tasks
pjfy tasks list --status todo

# 7. Update a task
pjfy tasks update task_456 --status in_progress

# 8. Get JSON output for scripting
pjfy tasks list --json | jq '.[] | select(.priority == "high")'
```

### Using with Multiple Projects

```bash
# List tasks from different projects
pjfy tasks list --project proj_123
pjfy tasks list --project proj_456

# Or set a default project
pjfy config set defaultProject proj_123
pjfy tasks list  # Uses proj_123

# Override with --project flag
pjfy tasks list --project proj_456
```

### Local vs Global Config

```bash
# Set global API key
pjfy auth login

# Set project-specific config in current directory
pjfy config set defaultProject proj_local --local
pjfy config set baseUrl http://localhost:3000 --local

# View merged config
pjfy config list
```

## Authentication

The CLI uses user API keys for authentication. To generate an API key:

1. Visit your Projectify web app settings
2. Navigate to Settings → API Keys
3. Generate a new API key with required scopes:
   - `projects:read`, `projects:write`
   - `tasks:read`, `tasks:write`
4. Copy the key and paste it when running `pjfy auth login`

API keys are stored securely in your config file. Never commit your config file to version control!

## Error Handling

The CLI provides helpful error messages:

- **Authentication errors**: "Not authenticated. Run `pjfy auth login`"
- **Validation errors**: Missing required fields or invalid values
- **Network errors**: Connection or timeout issues
- **Not found errors**: Resource doesn't exist

Use `--verbose` flag for detailed error information and stack traces.

## Development

```bash
# Install dependencies
cd apps/cli
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Link for local testing
npm link

# Test commands
pjfy --help
pjfy auth status
```

## Architecture

- **Framework**: Commander.js for CLI parsing
- **UI**: Chalk (colors), Ora (spinners), Inquirer (prompts), cli-table3 (tables)
- **Config**: Conf for persistent storage
- **Backend**: Convex HTTP client for API calls
- **Build**: tsup for TypeScript compilation

## Troubleshooting

### "Not authenticated" error

```bash
pjfy auth login
```

### "Base URL not configured" error

```bash
pjfy config set baseUrl http://localhost:3000
```

### "Project ID required" error

```bash
# Set a default project
pjfy config set defaultProject <project-id>

# Or use --project flag
pjfy tasks list --project <project-id>
```

### Clear config and start fresh

```bash
pjfy auth logout
rm ~/.projectify/config.json
rm .projectify/config.json
pjfy auth login
```

## Support

For full documentation, see [CLI-PRD.md](../../CLI-PRD.md) in the repository root.

For issues or questions, please contact the maintainers.

## License

Private - All Rights Reserved
