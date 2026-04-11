import { Command } from "commander"
import chalk from "chalk"
import fs from "fs"
import path from "path"
import { apiClient } from "../api-client.js"
import { config, DEFAULT_BASE_URL } from "../config.js"
import { handleError, requireAuth, ValidationError } from "../errors.js"
import { formatDateTime, formatFileSize, formatJSON, formatTable, truncate } from "../utils/formatters.js"
import { selectProjectId } from "../utils/selectors.js"
import { startSpinner, stopSpinner, succeedSpinner } from "../utils/spinner.js"

interface ResourceItem {
  id: string
  projectId: string
  type: "file" | "link"
  name: string
  url?: string
  fileType?: string
  fileSize?: number
  folderId?: string
  createdAt: number
  updatedAt: number
}

interface ResourceListResponse {
  resources: ResourceItem[]
  total: number
}

interface ResourceResponse {
  resource: ResourceItem
}

interface UploadUrlResponse {
  uploadUrl: string
}

interface UploadStorageResponse {
  storageId?: string
}

interface GlobalOptions {
  json?: boolean
  noColor?: boolean
  project?: string
}

function configureClient(): void {
  const apiKey = requireAuth(config.getAll())
  const baseUrl = config.get("baseUrl") || DEFAULT_BASE_URL
  apiClient.setBaseUrl(baseUrl)
  apiClient.setApiKey(apiKey)
}

function getGlobalOptions(command: Command): GlobalOptions {
  return command.optsWithGlobals() as GlobalOptions
}

function resolveProjectId(options: { project?: string }, command: Command): string | undefined {
  const globalOpts = getGlobalOptions(command)
  return options.project || globalOpts.project || config.get("defaultProject")
}

function detectFileType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === ".pdf") return "application/pdf"
  if (extension === ".png") return "image/png"
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg"
  if (extension === ".gif") return "image/gif"
  if (extension === ".svg") return "image/svg+xml"
  if (extension === ".txt") return "text/plain"
  if (extension === ".md") return "text/markdown"
  if (extension === ".json") return "application/json"
  if (extension === ".zip") return "application/zip"
  return "application/octet-stream"
}

async function uploadToStorage(uploadUrl: string, filePath: string, fileName: string): Promise<string> {
  const buffer = await fs.promises.readFile(filePath)
  const formData = new FormData()
  const blob = new Blob([buffer], { type: detectFileType(filePath) })
  formData.append("file", blob, fileName)

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload file to storage")
  }

  const payload = (await response.json()) as UploadStorageResponse
  if (!payload.storageId) {
    throw new Error("Upload did not return a storage ID")
  }
  return payload.storageId
}

export function createResourcesCommand(): Command {
  const resources = new Command("resources").description("Manage project resources")

  resources
    .command("list")
    .description("List resources")
    .option("--project <id>", "Project ID")
    .option("--type <type>", "Resource type (file/link)")
    .option("--folder <folderId>", "Folder ID")
    .option("--limit <n>", "Limit results", "50")
    .option("--json", "Output in JSON format")
    .action(async (options, command) => {
      try {
        configureClient()
        const projectId =
          resolveProjectId(options, command) ??
          (await selectProjectId(config.get("defaultProject")))

        const { spinner, startedAt } = startSpinner("Fetching resources...")
        const result = await apiClient.get<ResourceListResponse>("/api/resources", {
          projectId,
          type: options.type,
          folderId: options.folder,
          limit: Number.parseInt(options.limit, 10),
        })
        await stopSpinner(spinner, startedAt)

        const globalOpts = getGlobalOptions(command)
        const useJSON = options.json || globalOpts.json
        if (useJSON) {
          console.log(formatJSON(result))
          return
        }

        const output = formatTable(
          result.resources,
          [
            { key: "id", header: "ID", width: 16 },
            { key: "name", header: "Name", width: 30, format: (v) => truncate(String(v), 28) },
            { key: "type", header: "Type", width: 8 },
            {
              key: "fileSize",
              header: "Size",
              width: 12,
              format: (v) => (typeof v === "number" ? formatFileSize(v) : "-"),
            },
            {
              key: "updatedAt",
              header: "Updated",
              width: 22,
              format: (v) => formatDateTime(v as number),
            },
          ],
          { noColor: globalOpts.noColor }
        )
        console.log(output)
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  resources
    .command("upload <filePath>")
    .description("Upload a file resource")
    .option("--project <id>", "Project ID")
    .option("--name <name>", "Resource name")
    .option("--folder <folderId>", "Folder ID")
    .action(async (filePath, options, command) => {
      try {
        configureClient()
        const projectId =
          resolveProjectId(options, command) ??
          (await selectProjectId(config.get("defaultProject")))

        const absolutePath = path.resolve(filePath)
        if (!fs.existsSync(absolutePath)) {
          throw new ValidationError(`File not found: ${absolutePath}`)
        }
        const stats = await fs.promises.stat(absolutePath)
        if (!stats.isFile()) {
          throw new ValidationError("Path must point to a file")
        }

        const name = options.name || path.basename(absolutePath)
        const fileType = detectFileType(absolutePath)

        const { spinner, startedAt } = startSpinner("Preparing upload...")
        const { uploadUrl } = await apiClient.post<UploadUrlResponse>("/api/resources/upload-url", {
          projectId,
        })
        const storageId = await uploadToStorage(uploadUrl, absolutePath, name)

        const result = await apiClient.post<ResourceResponse>("/api/resources/file", {
          projectId,
          name,
          storageId,
          fileType,
          fileSize: stats.size,
          folderId: options.folder,
        })
        await succeedSpinner(spinner, startedAt, chalk.green(`File uploaded: ${result.resource.name}`))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  resources
    .command("add-link")
    .description("Add a link resource")
    .option("--project <id>", "Project ID")
    .option("--name <name>", "Link name")
    .option("--url <url>", "Link URL")
    .option("--folder <folderId>", "Folder ID")
    .action(async (options, command) => {
      try {
        configureClient()
        const projectId =
          resolveProjectId(options, command) ??
          (await selectProjectId(config.get("defaultProject")))
        if (!options.name || !options.url) {
          throw new ValidationError("--name and --url are required")
        }

        const { spinner, startedAt } = startSpinner("Adding link...")
        const result = await apiClient.post<ResourceResponse>("/api/resources/link", {
          projectId,
          name: options.name,
          url: options.url,
          folderId: options.folder,
        })
        await succeedSpinner(spinner, startedAt, chalk.green(`Link added: ${result.resource.name}`))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return resources
}
