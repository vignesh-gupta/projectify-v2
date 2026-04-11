import { Command } from "commander"
import chalk from "chalk"
import { apiClient } from "../api-client.js"
import { config, DEFAULT_BASE_URL } from "../config.js"
import { handleError, requireAuth, ValidationError } from "../errors.js"
import { formatJSON, formatStatus, formatTable, truncate } from "../utils/formatters.js"
import { promptSelect, promptText } from "../utils/prompts.js"
import { startSpinner, stopSpinner, succeedSpinner } from "../utils/spinner.js"

interface FeedbackItem {
  id: string
  projectId: string
  title: string
  description: string
  category: "bug" | "feature" | "improvement"
  status: "new" | "under_review" | "planned" | "in_progress" | "done" | "rejected"
  votes: number
}

interface FeedbackListResponse {
  feedback: FeedbackItem[]
  total: number
}

interface FeedbackResponse {
  feedback: FeedbackItem
}

interface VoteResponse {
  feedbackId: string
  votes: number
  voted: boolean
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

export function createFeedbackCommand(): Command {
  const feedback = new Command("feedback").description("Manage feedback")

  feedback
    .command("list")
    .description("List feedback items")
    .option("--project <id>", "Project ID")
    .option("--category <category>", "Category (bug/feature/improvement)")
    .option("--status <status>", "Status (new/under_review/planned/in_progress/done/rejected)")
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

        const { spinner, startedAt } = startSpinner("Fetching feedback...")
        const result = await apiClient.get<FeedbackListResponse>("/api/feedback", {
          projectId,
          category: options.category,
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
          result.feedback,
          [
            { key: "id", header: "ID", width: 16 },
            { key: "title", header: "Title", width: 36, format: (v) => truncate(String(v), 34) },
            { key: "category", header: "Category", width: 14 },
            { key: "status", header: "Status", width: 15, format: (v) => formatStatus(String(v), "feedback") },
            { key: "votes", header: "Votes", width: 8 },
          ],
          { noColor: globalOpts.noColor }
        )
        console.log(output)
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  feedback
    .command("create")
    .description("Create feedback")
    .option("--project <id>", "Project ID")
    .option("--title <title>", "Feedback title")
    .option("--description <desc>", "Feedback description")
    .option("--category <category>", "Category (bug/feature/improvement)", "feature")
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

        let title = options.title as string | undefined
        let description = options.description as string | undefined
        let category = options.category as "bug" | "feature" | "improvement"

        if (options.interactive) {
          title = await promptText("Feedback title:", {
            validate: (value) => value.trim().length > 0 || "Title cannot be empty",
          })
          description = await promptText("Description:", {
            validate: (value) => value.trim().length > 0 || "Description cannot be empty",
          })
          category = await promptSelect("Category:", ["bug", "feature", "improvement"], "feature")
        }

        if (!title?.trim() || !description?.trim()) {
          throw new ValidationError("--title and --description are required (or use --interactive)")
        }

        const { spinner, startedAt } = startSpinner("Creating feedback...")
        const result = await apiClient.post<FeedbackResponse>("/api/feedback", {
          projectId,
          title: title.trim(),
          description: description.trim(),
          category,
        })
        await succeedSpinner(spinner, startedAt, chalk.green(`Feedback created: ${result.feedback.title}`))
        console.log(chalk.dim(`ID: ${result.feedback.id}`))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  feedback
    .command("vote <id>")
    .description("Vote on feedback")
    .action(async (id, _options, command) => {
      try {
        configureClient()
        const { spinner, startedAt } = startSpinner("Updating vote...")
        const result = await apiClient.post<VoteResponse>(`/api/feedback/${id}/vote`, {})
        await succeedSpinner(
          spinner,
          startedAt,
          chalk.green(result.voted ? "Vote added" : "Vote removed")
        )
        console.log(chalk.dim(`Total votes: ${result.votes}`))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return feedback
}
