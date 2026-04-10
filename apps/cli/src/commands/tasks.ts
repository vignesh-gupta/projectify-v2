import { Command } from "commander"
import chalk from "chalk"
import { apiClient } from "../api-client.js"
import { config, DEFAULT_BASE_URL } from "../config.js"
import { handleError, requireAuth, ValidationError } from "../errors.js"
import {
  formatDate,
  formatJSON,
  formatPriority,
  formatStatus,
  formatTable,
  truncate,
} from "../utils/formatters.js"
import { promptConfirm, promptTaskCreate } from "../utils/prompts.js"
import { failSpinner, startSpinner, stopSpinner, succeedSpinner } from "../utils/spinner.js"

interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  dueDate?: string | number
  assigneeUserId?: string
}

interface TaskListResponse {
  tasks: Task[]
  total: number
}

interface TaskResponse {
  task: Task
}

function configureClient(): void {
  const apiKey = requireAuth(config.getAll())
  const baseUrl = config.get("baseUrl") || DEFAULT_BASE_URL
  apiClient.setBaseUrl(baseUrl)
  apiClient.setApiKey(apiKey)
}

function toIsoDate(value?: number): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

export function createTasksCommand(): Command {
  const tasks = new Command("tasks").description("Manage tasks")

  tasks
    .command("list")
    .alias("ls")
    .description("List tasks")
    .option("--project <id>", "Filter by project ID")
    .option("--status <status>", "Filter by status (todo/in_progress/done)")
    .option("--priority <priority>", "Filter by priority (low/medium/high)")
    .option("--limit <n>", "Limit number of results", "50")
    .option("--json", "Output in JSON format")
    .action(async (options, command) => {
      try {
        configureClient()

        const projectId = options.project || config.get("defaultProject")
        if (!projectId) {
          throw new ValidationError(
            "Project ID required. Use --project or set default with `pjfy config set defaultProject <id>`"
          )
        }

        const { spinner, startedAt } = startSpinner("Fetching tasks...")
        const result = await apiClient.get<TaskListResponse>("/api/tasks", {
          projectId,
          status: options.status,
          priority: options.priority,
          limit: Number.parseInt(options.limit, 10),
        })
        await stopSpinner(spinner, startedAt)

        const globalOpts = command.parent?.opts() || {}
        const useJSON = options.json || globalOpts.json

        if (useJSON) {
          console.log(formatJSON(result))
          return
        }

        const output = formatTable(
          result.tasks,
          [
            { key: "id", header: "ID", width: 15 },
            { key: "title", header: "Title", width: 35, format: (v) => truncate(String(v), 33) },
            { key: "status", header: "Status", width: 15, format: (v) => formatStatus(String(v), "task") },
            { key: "priority", header: "Priority", width: 12, format: (v) => formatPriority(String(v)) },
            { key: "dueDate", header: "Due Date", width: 15, format: (v) => formatDate(v as string | number | undefined) },
          ],
          { noColor: globalOpts.noColor }
        )
        console.log(output)
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  tasks
    .command("create")
    .description("Create a new task")
    .option("--project <id>", "Project ID")
    .option("--title <title>", "Task title")
    .option("--description <desc>", "Task description")
    .option("--status <status>", "Status (todo/in_progress/done)", "todo")
    .option("--priority <priority>", "Priority (low/medium/high)", "medium")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--interactive", "Use interactive mode")
    .action(async (options, command) => {
      try {
        configureClient()

        const projectId = options.project || config.get("defaultProject")
        if (!projectId) {
          throw new ValidationError(
            "Project ID required. Use --project or set default with `pjfy config set defaultProject <id>`"
          )
        }

        let taskData: {
          projectId: string
          title: string
          description?: string
          status?: "todo" | "in_progress" | "done"
          priority?: "low" | "medium" | "high"
          dueDate?: string
        }

        if (options.interactive) {
          const promptData = await promptTaskCreate()
          taskData = {
            projectId,
            title: promptData.title,
            description: promptData.description,
            status: promptData.status,
            priority: promptData.priority,
            dueDate: toIsoDate(promptData.dueDate),
          }
        } else {
          if (!options.title) {
            throw new ValidationError("--title is required (or use --interactive)")
          }

          taskData = {
            projectId,
            title: options.title,
            description: options.description,
            status: options.status as "todo" | "in_progress" | "done",
            priority: options.priority as "low" | "medium" | "high",
            dueDate: options.dueDate ? new Date(options.dueDate).toISOString() : undefined,
          }
        }

        const { spinner, startedAt } = startSpinner("Creating task...")
        const result = await apiClient.post<TaskResponse>("/api/tasks", taskData)
        await succeedSpinner(
          spinner,
          startedAt,
          chalk.green(`Task created: ${result.task.title}`)
        )
        console.log(chalk.dim(`ID: ${result.task.id}`))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  tasks
    .command("get <id>")
    .description("Get task details")
    .option("--json", "Output in JSON format")
    .action(async (id, options, command) => {
      try {
        configureClient()
        const { spinner, startedAt } = startSpinner("Fetching task...")
        const result = await apiClient.get<TaskResponse>(`/api/tasks/${id}`)
        await stopSpinner(spinner, startedAt)

        const globalOpts = command.parent?.opts() || {}
        const useJSON = options.json || globalOpts.json

        if (useJSON) {
          console.log(formatJSON(result))
          return
        }

        const task = result.task
        console.log(chalk.bold("\nTask Details:\n"))
        console.log(chalk.cyan("Title:"), task.title)
        console.log(chalk.cyan("Description:"), task.description || "-")
        console.log(chalk.cyan("Status:"), formatStatus(task.status, "task"))
        console.log(chalk.cyan("Priority:"), formatPriority(task.priority))
        console.log(chalk.cyan("Due Date:"), formatDate(task.dueDate))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  tasks
    .command("update <id>")
    .description("Update a task")
    .option("--title <title>", "New title")
    .option("--description <desc>", "New description")
    .option("--status <status>", "New status (todo/in_progress/done)")
    .option("--priority <priority>", "New priority (low/medium/high)")
    .option("--due-date <date>", "New due date (YYYY-MM-DD)")
    .action(async (id, options, command) => {
      try {
        configureClient()

        const updates: Record<string, string> = {}
        if (options.title) updates.title = options.title
        if (options.description) updates.description = options.description
        if (options.status) updates.status = options.status
        if (options.priority) updates.priority = options.priority
        if (options.dueDate) updates.dueDate = new Date(options.dueDate).toISOString()

        if (Object.keys(updates).length === 0) {
          throw new ValidationError("At least one update option is required")
        }

        const { spinner, startedAt } = startSpinner("Updating task...")
        await apiClient.patch<TaskResponse>(`/api/tasks/${id}`, updates)
        await succeedSpinner(spinner, startedAt, chalk.green("Task updated"))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  tasks
    .command("delete <id>")
    .alias("rm")
    .description("Delete a task")
    .option("--force", "Skip confirmation prompt")
    .action(async (id, options, command) => {
      try {
        configureClient()
        const { spinner: fetchSpinner, startedAt: fetchStartedAt } = startSpinner(
          "Fetching task..."
        )
        const taskResult = await apiClient.get<TaskResponse>(`/api/tasks/${id}`)
        await stopSpinner(fetchSpinner, fetchStartedAt)

        if (!options.force) {
          const confirmed = await promptConfirm(
            `Are you sure you want to delete "${taskResult.task.title}"?`
          )
          if (!confirmed) {
            console.log(chalk.yellow("Cancelled"))
            return
          }
        }

        const { spinner, startedAt } = startSpinner("Deleting task...")
        const result = await apiClient.delete<{ success: boolean; message?: string }>(
          `/api/tasks/${id}`
        )

        if (result.success) {
          await succeedSpinner(spinner, startedAt, chalk.green(result.message || "Task deleted"))
        } else {
          await failSpinner(spinner, startedAt, chalk.red("Task deletion failed"))
        }
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return tasks
}
