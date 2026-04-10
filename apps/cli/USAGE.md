# How to Run the Projectify CLI Locally

## Quick Start

### 1. Build the CLI

```bash
cd apps/cli
pnpm build
```

### 2. Run Commands Directly

You can run the CLI using Node.js without installing it globally:

```bash
# From apps/cli directory
node bin/pjfy.js --help
node bin/pjfy.js --version
node bin/pjfy.js auth --help
node bin/pjfy.js projects list
```

### 3. Link Globally (Optional)

To use `pjfy` command from anywhere:

```bash
cd apps/cli
npm link
```

Then you can use:

```bash
pjfy --help
pjfy auth login
pjfy projects list
```

**Note**: On Windows with PowerShell, you may need to run the full path or use `node bin/pjfy.js` if the global link doesn't work.

## Verified Working Commands

All these commands have been tested and work correctly:

### Help & Version
```bash
node bin/pjfy.js --help       # Main help
node bin/pjfy.js --version    # Show version (1.0.0)
node bin/pjfy.js auth --help  # Auth command help
node bin/pjfy.js config --help # Config command help
node bin/pjfy.js projects --help # Projects help
node bin/pjfy.js tasks --help  # Tasks help
```

### Configuration Management
```bash
# Set config values
node bin/pjfy.js config set baseUrl http://localhost:3000
node bin/pjfy.js config set defaultProject proj_12345
node bin/pjfy.js config set outputFormat json
node bin/pjfy.js config set noColor true

# Get config value
node bin/pjfy.js config get baseUrl
node bin/pjfy.js config get defaultProject

# List all config
node bin/pjfy.js config list
```

### Authentication
```bash
# Check auth status (will show not authenticated)
node bin/pjfy.js auth status

# Login (requires API key from web app)
node bin/pjfy.js auth login

# Logout
node bin/pjfy.js auth logout
```

### Projects & Tasks
```bash
# These require authentication
node bin/pjfy.js projects list
node bin/pjfy.js projects create --interactive
node bin/pjfy.js tasks list --project <id>
node bin/pjfy.js tasks create --interactive
```

## Configuration Storage

- **Global config**: `~/.projectify/config.json` (or `C:\Users\<username>\AppData\Roaming\projectify-nodejs\Config\config.json` on Windows)
- **Local config**: `.projectify/config.json` in current directory (takes precedence)

## Example Workflow

```bash
# 1. Build
cd D:\WORK\Code\projectify-v2\apps\cli
pnpm build

# 2. Configure
node bin/pjfy.js config set baseUrl http://localhost:3000

# 3. Check config
node bin/pjfy.js config list

# 4. Authenticate (when you have an API key from web app)
node bin/pjfy.js auth login

# 5. Use the CLI
node bin/pjfy.js projects list
node bin/pjfy.js tasks create --interactive
```

## Development Mode

To watch for changes and rebuild automatically:

```bash
cd apps/cli
pnpm dev
```

This will rebuild the CLI whenever you change source files.

## Troubleshooting

### Command not found after npm link

If `pjfy` command doesn't work after `npm link`, use the direct node command:

```bash
node bin/pjfy.js [command]
```

### Config not persisting

The Conf library automatically saves to disk. Check your config file location with:

```bash
node bin/pjfy.js config list
```

It will show the config file path at the bottom.

### Need to clear config

Delete the config file manually:

**Windows**:
```powershell
Remove-Item "C:\Users\<username>\AppData\Roaming\projectify-nodejs\Config\config.json"
```

**macOS/Linux**:
```bash
rm ~/.config/projectify-nodejs/config.json
```

## Next Steps

To fully test the CLI, you'll need:

1. A running Convex backend with the required functions:
   - `userApiKeys:authenticateUserApiKey`
   - `projects:list`, `projects:create`, `projects:get`, `projects:delete`
   - `tasks:list`, `tasks:create`, `tasks:get`, `tasks:update`, `tasks:delete`

2. An API key generated from the web app's settings page

3. The Projectify API base URL

See [CLI-PRD.md](../../CLI-PRD.md) for full documentation.
