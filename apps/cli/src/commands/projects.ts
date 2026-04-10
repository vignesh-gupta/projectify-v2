import { Command } from "commander"
import chalk from "chalk"
import { apiClient } from "../api-client.js"
import { config, DEFAULT_BASE_URL } from "../config.js"
import { handleError, requireAuth, ValidationError } from "../errors.js"
import {
  formatDate,
  formatJSON,
  formatStatus,
  formatTable,
  truncate,
} from "../utils/formatters.js"
import {
  promptConfirm,
  promptProjectCreate,
  promptProjectSelect,
} from "../utils/prompts.js"
import {
  failSpinner,
  startSpinner,
  stopSpinner,
  succeedSpinner,
} from "../utils/spinner.js"

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

async function selectAndSaveDefaultProject(
  command: Command,
  projectId?: string
): Promise<void> {
  configureClient()

  let selectedProject: Project | undefined

  if (projectId) {
    const { spinner, startedAt } = startSpinner("Fetching project...")
    const result = await apiClient.get<ProjectResponse>(
      `/api/projects/${projectId}`
    )
    await stopSpinner(spinner, startedAt)
    selectedProject = result.project
  } else {
    const { spinner, startedAt } = startSpinner("Fetching projects...")
    const result = await apiClient.get<ProjectListResponse>("/api/projects", {
      limit: 100,
    })
    await stopSpinner(spinner, startedAt)

    if (result.projects.length === 0) {
      throw new ValidationError(
        "No projects found. Create one with `pjfy projects create` first."
      )
    }

    const selectedProjectId = await promptProjectSelect(
      result.projects.map((project) => ({
        id: project.id,
        title: project.title,
      })),
      config.get("defaultProject")
    )
    selectedProject = result.projects.find(
      (project) => project.id === selectedProjectId
    )
  }

  if (!selectedProject) {
    throw new ValidationError("Project not found")
  }

  config.set("defaultProject", selectedProject.id)
  console.log(
    chalk.green("✓"),
    `Project in use: ${chalk.cyan(selectedProject.title)}`
  )
  console.log(chalk.dim(`ID: ${selectedProject.id}`))
}

export function createProjectsCommand(): Command {
  const projects = new Command("projects")
    .description("Manage projects")
    .alias("proj")

  projects.action(async (_, command) => {
    try {
      await selectAndSaveDefaultProject(command)
    } catch (error) {
      handleError(error, command.parent?.opts().verbose)
    }
  })

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
        const { spinner, startedAt } = startSpinner("Fetching projects...")

        const result = await apiClient.get<ProjectListResponse>(
          "/api/projects",
          {
            status: options.status,
            limit: Number.parseInt(options.limit, 10),
          }
        )

        await stopSpinner(spinner, startedAt)

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
            {
              key: "title",
              header: "Title",
              width: 30,
              format: (v) => truncate(String(v), 28),
            },
            {
              key: "status",
              header: "Status",
              width: 15,
              format: (v) => formatStatus(String(v), "project"),
            },
            {
              key: "dueDate",
              header: "Due Date",
              width: 15,
              format: (v) => formatDate(v as string | number | undefined),
            },
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
    .option(
      "--status <status>",
      "Status (development/maintenance/inactive)",
      "development"
    )
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
            throw new ValidationError(
              "--title is required (or use --interactive)"
            )
          }
          projectData = {
            title: options.title,
            description: options.description,
            status: options.status as
              | "development"
              | "maintenance"
              | "inactive",
            dueDate: options.dueDate
              ? new Date(options.dueDate).toISOString()
              : undefined,
          }
        }

        const { spinner, startedAt } = startSpinner("Creating project...")
        const result = await apiClient.post<ProjectResponse>(
          "/api/projects",
          projectData
        )
        await succeedSpinner(
          spinner,
          startedAt,
          chalk.green(`Project created: ${result.project.title}`)
        )
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
        const { spinner, startedAt } = startSpinner("Fetching project...")
        const result = await apiClient.get<ProjectResponse>(
          `/api/projects/${id}`
        )
        await stopSpinner(spinner, startedAt)

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
        console.log(
          chalk.cyan("Status:"),
          formatStatus(project.status, "project")
        )
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
        const { spinner: fetchSpinner, startedAt: fetchStartedAt } =
          startSpinner("Fetching project...")
        const projectResult = await apiClient.get<ProjectResponse>(
          `/api/projects/${id}`
        )
        await stopSpinner(fetchSpinner, fetchStartedAt)

        if (!options.force) {
          const confirmed = await promptConfirm(
            `Are you sure you want to delete "${projectResult.project.title}"?`
          )
          if (!confirmed) {
            console.log(chalk.yellow("Cancelled"))
            return
          }
        }

        const { spinner, startedAt } = startSpinner("Deleting project...")
        const result = await apiClient.delete<{
          success: boolean
          message?: string
        }>(`/api/projects/${id}`)

        if (result.success) {
          await succeedSpinner(
            spinner,
            startedAt,
            chalk.green(result.message || "Project deleted")
          )
        } else {
          await failSpinner(
            spinner,
            startedAt,
            chalk.red("Project deletion failed")
          )
        }
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return projects
}

export function createProjectCommand(): Command {
  const project = new Command("project").description("Set active project")

  project
    .command("use <id>")
    .description("Set the default project by ID")
    .action(async (id, _options, command) => {
      try {
        await selectAndSaveDefaultProject(command, id)
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return project
}
