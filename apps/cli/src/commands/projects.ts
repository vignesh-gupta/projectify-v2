import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"
import { apiClient } from "../api-client.js"
import { config, DEFAULT_BASE_URL } from "../config.js"
import { handleError, requireAuth, ValidationError } from "../errors.js"
import { formatDate, formatJSON, formatStatus, formatTable, truncate } from "../utils/formatters.js"
import { promptConfirm, promptProjectCreate } from "../utils/prompts.js"

interface Project {
  id: string
  title: string
  description: string
  status: "development" | "maintenance" | "inactive"
  dueDate?: string | number
  icon?: string | null
}

interface ProjectListResponse {
  projects: Project[]
  total: number
}

interface ProjectResponse {
  project: Project
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

export function createProjectsCommand(): Command {
  const projects = new Command("projects").description("Manage projects").alias("proj")

  projects
    .command("list")
    .alias("ls")
    .description("List all projects")
    .option("--status <status>", "Filter by status")
    .option("--limit <n>", "Limit results", "50")
    .option("--json", "Output in JSON format")
    .action(async (options, command) => {
      try {
        configureClient()
        const spinner = ora("Fetching projects...").start()

        const result = await apiClient.get<ProjectListResponse>("/api/projects", {
          status: options.status,
          limit: Number.parseInt(options.limit, 10),
        })

        spinner.stop()

        const globalOpts = command.parent?.opts() || {}
        const useJSON = options.json || globalOpts.json

        if (useJSON) {
          console.log(formatJSON(result))
          return
        }

        const output = formatTable(
          result.projects,
          [
            { key: "id", header: "ID", width: 20 },
            { key: "title", header: "Title", width: 30, format: (v) => truncate(String(v), 28) },
            { key: "status", header: "Status", width: 15, format: (v) => formatStatus(String(v), "project") },
            { key: "dueDate", header: "Due Date", width: 15, format: (v) => formatDate(v as string | number | undefined) },
          ],
          { noColor: globalOpts.noColor }
        )
        console.log(output)
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  projects
    .command("create")
    .description("Create a new project")
    .option("--title <title>", "Project title")
    .option("--description <desc>", "Project description")
    .option("--status <status>", "Status (development/maintenance/inactive)", "development")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--interactive", "Use interactive mode")
    .action(async (options, command) => {
      try {
        configureClient()

        let projectData: {
          title: string
          description?: string
          status?: "development" | "maintenance" | "inactive"
          dueDate?: string
        }

        if (options.interactive) {
          const promptData = await promptProjectCreate()
          projectData = {
            title: promptData.title,
            description: promptData.description,
            status: promptData.status,
            dueDate: toIsoDate(promptData.dueDate),
          }
        } else {
          if (!options.title) {
            throw new ValidationError("--title is required (or use --interactive)")
          }
          projectData = {
            title: options.title,
            description: options.description,
            status: options.status as "development" | "maintenance" | "inactive",
            dueDate: options.dueDate ? new Date(options.dueDate).toISOString() : undefined,
          }
        }

        const spinner = ora("Creating project...").start()
        const result = await apiClient.post<ProjectResponse>("/api/projects", projectData)
        spinner.succeed(chalk.green(`Project created: ${result.project.title}`))
        console.log(chalk.dim(`ID: ${result.project.id}`))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  projects
    .command("get <id>")
    .description("Get project details")
    .option("--json", "Output in JSON format")
    .action(async (id, options, command) => {
      try {
        configureClient()
        const spinner = ora("Fetching project...").start()
        const result = await apiClient.get<ProjectResponse>(`/api/projects/${id}`)
        spinner.stop()

        const globalOpts = command.parent?.opts() || {}
        const useJSON = options.json || globalOpts.json

        if (useJSON) {
          console.log(formatJSON(result))
          return
        }

        const project = result.project
        console.log(chalk.bold("\nProject Details:\n"))
        console.log(chalk.cyan("Title:"), project.title)
        console.log(chalk.cyan("Description:"), project.description || "-")
        console.log(chalk.cyan("Status:"), formatStatus(project.status, "project"))
        console.log(chalk.cyan("Due Date:"), formatDate(project.dueDate))
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  projects
    .command("delete <id>")
    .alias("rm")
    .description("Delete a project")
    .option("--force", "Skip confirmation prompt")
    .action(async (id, options, command) => {
      try {
        configureClient()
        const projectResult = await apiClient.get<ProjectResponse>(`/api/projects/${id}`)

        if (!options.force) {
          const confirmed = await promptConfirm(
            `Are you sure you want to delete "${projectResult.project.title}"?`
          )
          if (!confirmed) {
            console.log(chalk.yellow("Cancelled"))
            return
          }
        }

        const spinner = ora("Deleting project...").start()
        const result = await apiClient.delete<{ success: boolean; message?: string }>(
          `/api/projects/${id}`
        )

        if (result.success) {
          spinner.succeed(chalk.green(result.message || "Project deleted"))
        } else {
          spinner.fail(chalk.red("Project deletion failed"))
        }
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return projects
}
