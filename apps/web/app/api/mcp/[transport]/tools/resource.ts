import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { api } from "@/convex/_generated/api"
import { z } from "zod"
import { asId, readAuth, runTool, type ToolDeps } from "./shared"

const resourceTypeSchema = z.enum(["file", "link"])

export function registerResourceTools(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    "resources_list",
    {
      title: "List resources",
      description: "List project resources (files or links).",
      inputSchema: {
        projectId: z.string(),
        type: resourceTypeSchema.optional(),
        folderId: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ projectId, type, folderId, limit, offset }, extra) =>
      runTool("resources_list", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:read")
        return await client.query(api.resources.listByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          type,
          folderId: folderId ? asId<"folders">(folderId) : undefined,
          limit,
          offset,
        })
      })
  )

  server.registerTool(
    "resources_generate_upload_url",
    {
      title: "Generate resource upload URL",
      description: "Generate an upload URL for creating a file resource.",
      inputSchema: {
        projectId: z.string(),
      },
    },
    async ({ projectId }, extra) =>
      runTool("resources_generate_upload_url", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:write")
        const uploadUrl = await client.mutation(
          api.resources.generateUploadUrlByApiKey,
          {
            apiKey,
            projectId: asId<"projects">(projectId),
          }
        )
        return { uploadUrl }
      })
  )

  server.registerTool(
    "resources_create_file",
    {
      title: "Create file resource",
      description: "Create a file resource after uploading to storage.",
      inputSchema: {
        projectId: z.string(),
        name: z.string().min(1),
        storageId: z.string(),
        fileType: z.string().min(1),
        fileSize: z.number().int().min(0),
        folderId: z.string().optional(),
      },
    },
    async ({ projectId, name, storageId, fileType, fileSize, folderId }, extra) =>
      runTool("resources_create_file", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:write")
        return await client.mutation(api.resources.createFileByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          name: name.trim(),
          storageId: asId<"_storage">(storageId),
          fileType,
          fileSize,
          folderId: folderId ? asId<"folders">(folderId) : undefined,
        })
      })
  )

  server.registerTool(
    "resources_create_link",
    {
      title: "Create link resource",
      description: "Create a link resource.",
      inputSchema: {
        projectId: z.string(),
        name: z.string().min(1),
        url: z.string().url(),
        favicon: z.string().url().optional(),
        folderId: z.string().optional(),
      },
    },
    async ({ projectId, name, url, favicon, folderId }, extra) =>
      runTool("resources_create_link", async () => {
        const client = deps.getConvexClient()
        const apiKey = readAuth(extra, "projects:write")
        return await client.mutation(api.resources.createLinkByApiKey, {
          apiKey,
          projectId: asId<"projects">(projectId),
          name: name.trim(),
          url,
          favicon,
          folderId: folderId ? asId<"folders">(folderId) : undefined,
        })
      })
  )
}

