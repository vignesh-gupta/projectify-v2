import { APP_BASE_URL } from "@/lib/url"
import { NextResponse } from "next/server"

const tools = [
  { name: "projects_list", scope: "projects:read" },
  { name: "projects_get", scope: "projects:read" },
  { name: "projects_create", scope: "projects:write" },
  { name: "projects_update", scope: "projects:write" },
  { name: "projects_delete", scope: "projects:write" },
  { name: "tasks_list", scope: "tasks:read" },
  { name: "tasks_get", scope: "tasks:read" },
  { name: "tasks_create", scope: "tasks:write" },
  { name: "tasks_update", scope: "tasks:write" },
  { name: "tasks_delete", scope: "tasks:write" },
  { name: "feedback_list", scope: "feedback:read" },
  { name: "feedback_create", scope: "feedback:write" },
  { name: "feedback_vote", scope: "feedback:write" },
  { name: "messages_list", scope: "projects:read" },
  { name: "messages_send", scope: "projects:write" },
  { name: "resources_list", scope: "projects:read" },
  { name: "resources_generate_upload_url", scope: "projects:write" },
  { name: "resources_create_file", scope: "projects:write" },
  { name: "resources_create_link", scope: "projects:write" },
  { name: "changelog_list", scope: "changelog:read" },
  { name: "changelog_get_published_entry", scope: "changelog:read" },
  { name: "changelog_create_draft", scope: "changelog:write" },
  { name: "changelog_publish", scope: "changelog:write" },
]

export async function GET() {
  return NextResponse.json({
    name: "Projectify MCP Integration",
    protocol: "Model Context Protocol (MCP)",
    transport: "Streamable HTTP",
    mcpUrl: "/api/mcp",
    authentication: {
      type: "Bearer API key",
      header: "Authorization: Bearer <user_api_key>",
      keyPrefix: "uk_",
      notes: [
        "Uses Projectify user API keys from Settings > API Keys",
        "Tool access is enforced by API key scopes",
      ],
    },
    tools,
    clientExamples: {
      direct: {
        mcpServers: {
          projectify: {
            url: `${APP_BASE_URL}/api/mcp`,
            headers: {
              Authorization: "Bearer uk_your_api_key_here",
            },
          },
        },
      },
      stdioProxy: {
        mcpServers: {
          projectify: {
            command: "npx",
            args: ["-y", "mcp-remote", `${APP_BASE_URL}/api/mcp`],
            env: {
              MCP_AUTH_TOKEN: "uk_your_api_key_here",
            },
          },
        },
      },
    },
    docsPage: "/docs/mcp",
  })
}
