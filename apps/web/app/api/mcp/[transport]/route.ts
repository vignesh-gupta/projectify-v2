import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js"
import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { api } from "@/convex/_generated/api"
import { getConvexClient } from "@/convex/lib/client"
import { getPublishedChangelogEntry } from "@/lib/changelog-api"
import { renderChangelogContent } from "@/lib/changelog-presenter"
import {
  registerChangelogTools,
  registerFeedbackTools,
  registerMessageTools,
  registerProjectTools,
  registerResourceTools,
  registerTaskTools,
  type ToolDeps,
} from "./tools"

const toolDeps: ToolDeps = {
  getConvexClient,
  getPublishedChangelogEntry,
  renderChangelogContent,
}

const baseHandler = createMcpHandler(
  (server) => {
    registerProjectTools(server, toolDeps)
    registerTaskTools(server, toolDeps)
    registerFeedbackTools(server, toolDeps)
    registerMessageTools(server, toolDeps)
    registerResourceTools(server, toolDeps)
    registerChangelogTools(server, toolDeps)
  },
  {
    serverInfo: {
      name: "projectify-mcp",
      version: "1.0.0",
    },
    capabilities: {
      tools: {},
    },
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: false,
  }
)

const verifyToken = async (
  _request: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined

  const client = getConvexClient()
  const result = await client.action(api.userApiKeys.authenticateUserApiKey, {
    apiKey: bearerToken,
  })

  if (!result.authenticated) return undefined

  return {
    token: bearerToken,
    scopes: result.scopes,
    clientId: result.userId,
    extra: {
      userId: result.userId,
    },
  }
}

const handler = withMcpAuth(baseHandler, verifyToken, {
  required: true,
})

export {
  handler as GET,
  handler as POST,
  handler as DELETE,
  handler as PUT,
  handler as PATCH,
}

