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
import { promptConfirm, promptTaskCreate, promptText } from "../utils/prompts.js"
import { selectProjectId, selectTaskId } from "../utils/selectors.js"
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

interface GlobalOptions {
  json?: boolean
  noColor?: boolean
  project?: string
  verbose?: boolean
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
    .option("--assignee <userId>", "Filter by assignee user ID")
    .option("--limit <n>", "Limit number of results", "50")
    .option("--json", "Output in JSON format")
    .action(async (options, command) => {
      try {
        configureClient()

        const projectId =
          resolveProjectId(options, command) ??
          (await selectProjectId(config.get("defaultProject")))

        const { spinner, startedAt } = startSpinner("Fetching tasks...")
        const result = await apiClient.get<TaskListResponse>("/api/tasks", {
          projectId,
          status: options.status,
          priority: options.priority,
          assigneeId: options.assignee,
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
          result.tasks,
          [
            { key: "id", header: "ID", width: 15 },
            { key: "title", header: "Title", width: 35, format: (v) => truncate(String(v), 33) },
            { key: "status", header: "Status", width: 15, format: (v) => formatStatus(String(v), "task") },
            { key: "priority", header: "Priority", width: 12, format: (v) => formatPriority(String(v)) },
            { key: "assigneeUserId", header: "Assignee", width: 20 },
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
    .option("--assignee <userId>", "Assign task to user ID")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--interactive", "Use interactive mode")
    .action(async (options, command) => {
      try {
        configureClient()

        const projectId =
          resolveProjectId(options, command) ??
          (await selectProjectId(config.get("defaultProject")))

        let taskData: {
          projectId: string
          title: string
          description?: string
          status?: "todo" | "in_progress" | "done"
          priority?: "low" | "medium" | "high"
          dueDate?: string
          assigneeUserId?: string
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
            assigneeUserId: options.assignee,
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
            assigneeUserId: options.assignee,
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
    .command("get [id]")
    .description("Get task details")
    .option("--project <id>", "Project ID for selector")
    .option("--json", "Output in JSON format")
    .action(async (id, options, command) => {
      try {
        configureClient()
        const taskId =
          id ||
          (await selectTaskId(
            resolveProjectId(options, command) ??
              (await selectProjectId(config.get("defaultProject")))
          ))
        const { spinner, startedAt } = startSpinner("Fetching task...")
        const result = await apiClient.get<TaskResponse>(`/api/tasks/${taskId}`)
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
    .command("update [id]")
    .description("Update a task")
    .option("--project <id>", "Project ID for selector")
    .option("--title <title>", "New title")
    .option("--description <desc>", "New description")
    .option("--status <status>", "New status (todo/in_progress/done)")
    .option("--priority <priority>", "New priority (low/medium/high)")
    .option("--assignee <userId>", "New assignee user ID")
    .option("--due-date <date>", "New due date (YYYY-MM-DD)")
    .action(async (id, options, command) => {
      try {
        configureClient()
        const taskId =
          id ||
          (await selectTaskId(
            resolveProjectId(options, command) ??
              (await selectProjectId(config.get("defaultProject")))
          ))

        const updates: Record<string, string> = {}
        if (options.title) updates.title = options.title
        if (options.description) updates.description = options.description
        if (options.status) updates.status = options.status
        if (options.priority) updates.priority = options.priority
        if (options.dueDate) updates.dueDate = new Date(options.dueDate).toISOString()
        if (options.assignee) updates.assigneeUserId = options.assignee

        if (Object.keys(updates).length === 0) {
          throw new ValidationError("At least one update option is required")
        }

        const { spinner, startedAt } = startSpinner("Updating task...")
        await apiClient.patch<TaskResponse>(`/api/tasks/${taskId}`, updates)
        await succeedSpinner(spinner, startedAt, chalk.green("Task updated"))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  tasks
    .command("assign [id] [userId]")
    .description("Assign task to a user")
    .option("--project <id>", "Project ID for selector")
    .action(async (id, userId, options, command) => {
      try {
        configureClient()
        const taskId =
          id ||
          (await selectTaskId(
            resolveProjectId(options, command) ??
              (await selectProjectId(config.get("defaultProject")))
          ))
        const resolvedUserId =
          userId ||
          (await promptText("Assignee user ID:", {
            validate: (value) => value.trim().length > 0 || "User ID is required",
          }))

        const { spinner, startedAt } = startSpinner("Assigning task...")
        await apiClient.patch<TaskResponse>(`/api/tasks/${taskId}`, {
          assigneeUserId: resolvedUserId.trim(),
        })
        await succeedSpinner(spinner, startedAt, chalk.green("Task assigned"))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  tasks
    .command("delete [id]")
    .alias("rm")
    .description("Delete a task")
    .option("--project <id>", "Project ID for selector")
    .option("--force", "Skip confirmation prompt")
    .action(async (id, options, command) => {
      try {
        configureClient()
        const taskId =
          id ||
          (await selectTaskId(
            resolveProjectId(options, command) ??
              (await selectProjectId(config.get("defaultProject")))
          ))
        const { spinner: fetchSpinner, startedAt: fetchStartedAt } = startSpinner(
          "Fetching task..."
        )
        const taskResult = await apiClient.get<TaskResponse>(`/api/tasks/${taskId}`)
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
          `/api/tasks/${taskId}`
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
