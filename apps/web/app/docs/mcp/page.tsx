import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { APP_BASE_URL } from "@/lib/url"

const toolsByDomain = [
  {
    title: "Projects",
    tools: [
      "projects_list",
      "projects_get",
      "projects_create",
      "projects_update",
      "projects_delete",
    ],
  },
  {
    title: "Tasks",
    tools: [
      "tasks_list",
      "tasks_get",
      "tasks_create",
      "tasks_update",
      "tasks_delete",
    ],
  },
  {
    title: "Feedback",
    tools: ["feedback_list", "feedback_create", "feedback_vote"],
  },
  {
    title: "Resources",
    tools: [
      "resources_list",
      "resources_generate_upload_url",
      "resources_create_file",
      "resources_create_link",
    ],
  },
  {
    title: "Messages",
    tools: ["messages_list", "messages_send"],
  },
  {
    title: "Changelog",
    tools: [
      "changelog_list",
      "changelog_get_published_entry",
      "changelog_create_draft",
      "changelog_publish",
    ],
  },
]

const scopes = [
  "projects:read",
  "projects:write",
  "tasks:read",
  "tasks:write",
  "feedback:read",
  "feedback:write",
  "changelog:read",
  "changelog:write",
]

export default function McpDocsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-12">
      <header className="space-y-3">
        <Badge variant="outline">Public Documentation</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Projectify MCP Server
        </h1>
        <p className="text-muted-foreground">
          Connect AI agents to Projectify over Model Context Protocol using API
          keys only.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Server endpoint and auth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
            {`MCP URL: ${APP_BASE_URL}/api/mcp
Authorization: Bearer uk_your_api_key_here`}
          </pre>
          <p>
            Create API keys in <code>/settings?tab=api-keys</code>. Every MCP
            tool checks scopes before execution.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client config examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">
              Streamable HTTP clients (direct)
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
              {`{
  "mcpServers": {
    "projectify": {
      "url": "${APP_BASE_URL}/api/mcp",
      "headers": {
        "Authorization": "Bearer uk_your_api_key_here"
      }
    }
  }
}`}
            </pre>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">
              Stdio-only clients via mcp-remote
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
              {`{
  "mcpServers": {
    "projectify": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${APP_BASE_URL}/api/mcp"
      ],
      "env": {
        "MCP_AUTH_TOKEN": "uk_your_api_key_here"
      }
    }
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported scopes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {scopes.map((scope) => (
            <Badge key={scope} variant="secondary">
              {scope}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tool catalog</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {toolsByDomain.map((domain) => (
            <Card key={domain.title}>
              <CardHeader>
                <CardTitle className="text-base">{domain.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {domain.tools.map((tool) => (
                  <code
                    key={tool}
                    className="block rounded-md bg-muted px-2 py-1 text-xs"
                  >
                    {tool}
                  </code>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Security recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Use least-privilege scopes per agent.</p>
          <p>2. Rotate API keys regularly and revoke unused keys.</p>
          <p>
            3. Store keys in secret managers; never commit them to repositories.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/settings?tab=api-keys">Manage API keys</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/api/mcp-integrations">View MCP integration JSON</Link>
        </Button>
      </div>
    </main>
  )
}
