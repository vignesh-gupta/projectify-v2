import { Command } from "commander"
import chalk from "chalk"
import { apiClient } from "../api-client.js"
import { config, DEFAULT_BASE_URL } from "../config.js"
import { handleError, requireAuth, ValidationError } from "../errors.js"
import { formatDateTime, formatJSON, formatStatus, formatTable, truncate } from "../utils/formatters.js"
import { promptText } from "../utils/prompts.js"
import { startSpinner, stopSpinner, succeedSpinner } from "../utils/spinner.js"

interface ChangelogEntry {
  id: string
  projectId: string
  version: string
  title: string
  content: string
  status: "draft" | "published"
  publishedAt?: number
  createdAt: number
  updatedAt: number
}

interface ChangelogListResponse {
  entries: ChangelogEntry[]
  total: number
}

interface ChangelogEntryResponse {
  entry: ChangelogEntry
}

interface ChangelogPublishResponse {
  changelogId: string
  status: "published"
  publishedAt: number
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

export function createChangelogCommand(): Command {
  const changelog = new Command("changelog").description("Manage changelog entries")

  changelog
    .command("list")
    .description("List changelog entries")
    .option("--project <id>", "Project ID")
    .option("--status <status>", "Status (draft/published)")
    .option("--limit <n>", "Limit results", "50")
    .option("--json", "Output in JSON format")
    .action(async (options, command) => {
      try {
        configureClient()
        const projectId = resolveProjectId(options, command)
        if (!projectId) {
          throw new ValidationError(
            "Project ID required. Use --project or set default with `pjfy config set defaultProject <id>`"
          )
        }

        const { spinner, startedAt } = startSpinner("Fetching changelog entries...")
        const result = await apiClient.get<ChangelogListResponse>("/api/changelog", {
          projectId,
          status: options.status,
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
          result.entries,
          [
            { key: "id", header: "ID", width: 16 },
            { key: "version", header: "Version", width: 10 },
            { key: "title", header: "Title", width: 34, format: (v) => truncate(String(v), 32) },
            { key: "status", header: "Status", width: 12, format: (v) => formatStatus(String(v), "changelog") },
            { key: "publishedAt", header: "Published", width: 22, format: (v) => formatDateTime(v as number | undefined) },
          ],
          { noColor: globalOpts.noColor }
        )
        console.log(output)
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  changelog
    .command("create")
    .description("Create a changelog draft")
    .option("--project <id>", "Project ID")
    .option("--version <version>", "Version (semver)")
    .option("--title <title>", "Entry title")
    .option("--content <content>", "Entry content")
    .option("--interactive", "Use interactive mode")
    .action(async (options, command) => {
      try {
        configureClient()
        const projectId = resolveProjectId(options, command)
        if (!projectId) {
          throw new ValidationError(
            "Project ID required. Use --project or set default with `pjfy config set defaultProject <id>`"
          )
        }

        let version = options.version as string | undefined
        let title = options.title as string | undefined
        let content = options.content as string | undefined

        if (options.interactive) {
          version = await promptText("Version (e.g. 1.2.3):", {
            validate: (value) => /^\d+\.\d+\.\d+$/.test(value.trim()) || "Use semver format (x.y.z)",
          })
          title = await promptText("Title:", {
            validate: (value) => value.trim().length > 0 || "Title cannot be empty",
          })
          content = await promptText("Content:", {
            validate: (value) => value.trim().length > 0 || "Content cannot be empty",
          })
        }

        if (!version || !title || !content) {
          throw new ValidationError(
            "--version, --title and --content are required (or use --interactive)"
          )
        }

        const { spinner, startedAt } = startSpinner("Creating changelog draft...")
        const result = await apiClient.post<ChangelogEntryResponse>("/api/changelog", {
          projectId,
          version,
          title,
          content,
        })
        await succeedSpinner(
          spinner,
          startedAt,
          chalk.green(`Changelog draft created: ${result.entry.version}`)
        )
        console.log(chalk.dim(`ID: ${result.entry.id}`))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  changelog
    .command("publish <id>")
    .description("Publish a changelog draft")
    .action(async (id, _options, command) => {
      try {
        configureClient()
        const { spinner, startedAt } = startSpinner("Publishing changelog...")
        const result = await apiClient.post<ChangelogPublishResponse>(`/api/changelog/${id}/publish`, {})
        await succeedSpinner(
          spinner,
          startedAt,
          chalk.green(`Changelog published (${formatDateTime(result.publishedAt)})`)
        )
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return changelog
}
