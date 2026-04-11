import { apiClient } from "../api-client.js"
import { ValidationError } from "../errors.js"
import { promptProjectSelect, promptSelectChoice } from "./prompts.js"
import { truncate } from "./formatters.js"

interface ProjectListResponse {
  projects: Array<{ id: string; title: string }>
}

interface TaskListResponse {
  tasks: Array<{ id: string; title: string }>
}

interface FeedbackListResponse {
  feedback: Array<{ id: string; title: string }>
}

interface ChangelogListResponse {
  entries: Array<{ id: string; version: string; title: string }>
}

export async function selectProjectId(defaultProjectId?: string): Promise<string> {
  const result = await apiClient.get<ProjectListResponse>("/api/projects", { limit: 100 })
  if (!result.projects.length) {
    throw new ValidationError("No projects found. Create one with `pjfy projects create` first.")
  }
  return await promptProjectSelect(result.projects, defaultProjectId)
}

export async function selectTaskId(projectId: string): Promise<string> {
  const result = await apiClient.get<TaskListResponse>("/api/tasks", { projectId, limit: 100 })
  if (!result.tasks.length) {
    throw new ValidationError("No tasks found in selected project.")
  }
  return await promptSelectChoice(
    "Select a task:",
    result.tasks.map((task) => ({
      name: `${truncate(task.title, 50)} (${task.id})`,
      value: task.id,
    }))
  )
}

export async function selectFeedbackId(projectId: string): Promise<string> {
  const result = await apiClient.get<FeedbackListResponse>("/api/feedback", {
    projectId,
    limit: 100,
  })
  if (!result.feedback.length) {
    throw new ValidationError("No feedback items found in selected project.")
  }
  return await promptSelectChoice(
    "Select feedback:",
    result.feedback.map((item) => ({
      name: `${truncate(item.title, 50)} (${item.id})`,
      value: item.id,
    }))
  )
}

export async function selectChangelogId(projectId: string, status?: "draft" | "published"): Promise<string> {
  const result = await apiClient.get<ChangelogListResponse>("/api/changelog", {
    projectId,
    status,
    limit: 100,
  })
  if (!result.entries.length) {
    throw new ValidationError("No changelog entries found in selected project.")
  }
  return await promptSelectChoice(
    "Select changelog entry:",
    result.entries.map((item) => ({
      name: `${item.version} - ${truncate(item.title, 40)} (${item.id})`,
      value: item.id,
    }))
  )
}
