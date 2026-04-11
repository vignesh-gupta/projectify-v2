import { Command } from "commander"
import chalk from "chalk"
import { apiClient } from "../api-client.js"
import { config, DEFAULT_BASE_URL } from "../config.js"
import { handleError, requireAuth, ValidationError } from "../errors.js"
import { formatDateTime, formatJSON, formatTable, truncate } from "../utils/formatters.js"
import { promptText } from "../utils/prompts.js"
import { startSpinner, stopSpinner, succeedSpinner } from "../utils/spinner.js"

interface MessageAuthor {
  _id: string
  name: string | null
  email: string
}

interface MessageItem {
  id: string
  projectId: string
  authorId: string
  content: string
  createdAt: number
  updatedAt?: number
  author?: MessageAuthor | null
}

interface MessageListResponse {
  messages: MessageItem[]
  total: number
}

interface MessageResponse {
  message: MessageItem
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

export function createMessagesCommand(): Command {
  const messages = new Command("messages").description("Manage project messages")

  messages
    .command("list")
    .description("List recent messages")
    .option("--project <id>", "Project ID")
    .option("--limit <n>", "Limit results", "20")
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

        const { spinner, startedAt } = startSpinner("Fetching messages...")
        const result = await apiClient.get<MessageListResponse>("/api/messages", {
          projectId,
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
          result.messages,
          [
            { key: "id", header: "ID", width: 16 },
            {
              key: "author",
              header: "Author",
              width: 22,
              format: (v) => {
                const author = v as MessageAuthor | null | undefined
                return author?.name || author?.email || "-"
              },
            },
            { key: "content", header: "Content", width: 44, format: (v) => truncate(String(v), 42) },
            { key: "createdAt", header: "Created", width: 22, format: (v) => formatDateTime(v as number) },
          ],
          { noColor: globalOpts.noColor }
        )
        console.log(output)
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  messages
    .command("send")
    .description("Send a message")
    .option("--project <id>", "Project ID")
    .option("--content <content>", "Message content")
    .option("--thread <messageId>", "Reply to message thread")
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

        let content = options.content as string | undefined
        if (options.interactive) {
          content = await promptText("Message:", {
            validate: (value) => value.trim().length > 0 || "Message cannot be empty",
          })
        }

        if (!content?.trim()) {
          throw new ValidationError("--content is required (or use --interactive)")
        }

        const { spinner, startedAt } = startSpinner("Sending message...")
        const result = await apiClient.post<MessageResponse>("/api/messages", {
          projectId,
          content: content.trim(),
          threadId: options.thread,
        })
        await succeedSpinner(spinner, startedAt, chalk.green("Message sent"))
        console.log(chalk.dim(`ID: ${result.message.id}`))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return messages
}
