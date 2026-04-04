# API Keys Migration & Usage Guide

## Overview

User-level API keys have been implemented for authenticating with the Projectify API, CLI, and MCP servers. This replaces the previous project-level API keys.

## Migration Instructions

### 1. Deploy Schema Changes

The schema has been updated with new tables:
- `userApiKeys` - User-level API keys with scoped permissions
- `apiKeyConfig` - Per-user configuration for key limits

### 2. Run Migration (Optional)

If you have existing project-level API keys that need to be migrated:

```bash
# From the apps/web directory
pnpm cdev
```

Then in the Convex dashboard, run the migration function:

```javascript
// In the Functions tab, run:
await internal.migration.migrateProjectKeysToUserKeys()
```

This will:
- Convert all project API keys to user API keys
- Assign keys to the users who created them
- Map `read:changelog` scope to `changelog:read` + `changelog:write` (for owners/admins)
- Preserve all key hashes, status, and usage data

The migration returns a summary:
```javascript
{
  total: 5,        // Total project keys found
  migrated: 4,     // Successfully migrated
  skipped: 1,      // Skipped (e.g., user no longer has project access)
  errors: []       // Any errors encountered
}
```

### 3. Update Client Code

Update any code using the old project API keys to use the new user API keys.

## Usage

### Creating API Keys

1. Go to **Settings** → **API Keys** tab
2. Click **Create API Key**
3. Fill in:
   - **Name**: Descriptive name (e.g., "Production CLI Key")
   - **Permissions**: Select required scopes (see below)
   - **Expiration Date** (Optional): When the key should expire
4. Click **Create Key**
5. **Important**: Copy the key immediately - it's only shown once!

### Available Scopes

| Scope | Description |
|-------|-------------|
| `projects:read` | View projects |
| `projects:write` | Create and modify projects |
| `tasks:read` | View tasks |
| `tasks:write` | Create and modify tasks |
| `feedback:read` | View feedback |
| `feedback:write` | Create and modify feedback |
| `changelog:read` | View changelog entries |
| `changelog:write` | Create and publish changelog |

### Managing API Keys

- **View Keys**: See all your API keys with status, scopes, and last used date
- **Revoke Keys**: Click the trash icon to revoke a key (cannot be undone)
- **Key Limits**: Default limit is 10 keys per user (configurable)

### Using API Keys

#### HTTP Headers

Include the API key in one of two ways:

**Option 1: Authorization header (recommended)**
```bash
curl -H "Authorization: Bearer uk_xxxxx..." https://your-app.com/api/changelog/project123
```

**Option 2: x-api-key header**
```bash
curl -H "x-api-key: uk_xxxxx..." https://your-app.com/api/changelog/project123
```

#### Example API Requests

**List changelog entries**
```bash
curl -H "Authorization: Bearer uk_xxxxx..." \
  https://your-app.com/api/changelog/j57abc123
```

**Get specific changelog entry**
```bash
curl -H "Authorization: Bearer uk_xxxxx..." \
  https://your-app.com/api/changelog/j57abc123/j78def456
```

### Key Format

- Prefix: `uk_` (user key)
- Length: 35 characters total (3 char prefix + 32 char random string)
- Example: `uk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Security

- Keys are hashed using SHA-256 before storage
- Only a preview (first 7 + last 4 chars) is stored for display
- Full keys are only shown once upon creation
- Expired keys are automatically rejected
- Revoked keys cannot be reactivated

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Missing API key. Provide via Authorization header or x-api-key header.",
  "status": 401
}
```

**Causes:**
- No API key provided
- Invalid API key
- Expired API key
- Revoked API key

### 403 Forbidden

```json
{
  "error": "Insufficient permissions. Required scopes: changelog:read",
  "status": 403
}
```

**Causes:**
- API key doesn't have the required scope(s) for the endpoint

## Development

### Testing API Keys Locally

1. Start the Convex dev server:
   ```bash
   cd apps/web
   pnpm cdev
   ```

2. Start the Next.js dev server:
   ```bash
   pnpm dev
   ```

3. Create a test API key through the UI at `http://localhost:3000/settings?tab=api-keys`

4. Test with curl:
   ```bash
   curl -H "Authorization: Bearer uk_xxxxx..." \
     http://localhost:3000/api/changelog/your-project-id
   ```

### Adding New API Endpoints

To protect a new API endpoint with user API keys:

```typescript
import { authenticateRequest, createUnauthorizedResponse } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  // Authenticate and require specific scopes
  const auth = await authenticateRequest(request, ["projects:read"])
  
  if (!auth.authenticated) {
    return createUnauthorizedResponse(auth.error)
  }

  // auth.userId contains the authenticated user's ID
  // auth.scopes contains the user's scopes
  
  // Your endpoint logic here...
}
```

## Cleanup (After Migration)

Once you've confirmed the migration was successful and all integrations are working:

1. **Remove old project API key code** (already done in this implementation):
   - ❌ Old UI in changelog "Developers" tab
   - ❌ Old mutations in `convex/changelog.ts`
   - ❌ Old `apiKeys` table references

2. **Keep migration code** for historical reference:
   - ✅ `convex/migration.ts` - Keep for audit trail
   - ✅ Old `apiKeys` table in schema - Can be removed after 30 days

## Troubleshooting

### "API key not found"
- Key was typed incorrectly
- Key was revoked
- Key never existed (copy error during creation)

### "API key has expired"
- Key's expiration date has passed
- Create a new key or renew the existing one (if supported)

### "Insufficient permissions"
- Key doesn't have the required scope
- Update the key's scopes or create a new key with proper permissions

### "Maximum keys reached"
- User has reached their key limit (default: 10)
- Revoke unused keys before creating new ones
- Contact admin to increase limit if needed

## Admin Tasks

### Adjusting User Key Limits

Use the `updateApiKeyLimit` mutation:

```javascript
// In Convex dashboard Functions tab
await api.userApiKeys.updateApiKeyLimit({
  userId: "j57abc123...",
  maxKeys: 20
})
```

Limits:
- Minimum: 1 key
- Maximum: 50 keys (hard limit)
- Default: 10 keys

## Future Enhancements

This API key system is ready for:
- ✅ CLI authentication
- ✅ MCP server authentication
- ✅ Project API endpoints (when created)
- ✅ Task API endpoints (when created)
- ✅ Feedback API endpoints (when created)
- ✅ Third-party integrations
- ✅ Mobile app authentication

The infrastructure is in place - just add the `authenticateRequest()` middleware to new endpoints!
