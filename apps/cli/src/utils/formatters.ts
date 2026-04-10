import Table from "cli-table3"
import chalk from "chalk"

export interface TableColumn {
  key: string
  header: string
  width?: number
  align?: "left" | "center" | "right"
  format?: (value: any) => string
}

/**
 * Format data as a table
 */
export function formatTable(
  data: any[],
  columns: TableColumn[],
  options?: {
    noColor?: boolean
  }
): string {
  if (data.length === 0) {
    return chalk.yellow("No results found")
  }

  const table = new Table({
    head: columns.map((col) =>
      options?.noColor ? col.header : chalk.bold(col.header)
    ),
    colWidths: columns.map((col) => col.width ?? null),
    colAligns: columns.map((col) => col.align || "left"),
    style: {
      head: options?.noColor ? [] : ["cyan"],
      border: options?.noColor ? [] : ["gray"],
    },
  })

  data.forEach((item) => {
    const row = columns.map((col) => {
      const value = item[col.key]
      if (col.format) {
        return col.format(value)
      }
      return value !== undefined && value !== null ? String(value) : "-"
    })
    table.push(row)
  })

  return table.toString()
}

/**
 * Format data as JSON
 */
export function formatJSON(data: any): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Format status with color
 */
export function formatStatus(
  status: string,
  type: "project" | "task" | "feedback" | "changelog" = "task"
): string {
  const statusMap: Record<string, string> = {
    // Project statuses
    development: chalk.blue("development"),
    maintenance: chalk.yellow("maintenance"),
    inactive: chalk.gray("inactive"),

    // Task statuses
    todo: chalk.gray("todo"),
    in_progress: chalk.blue("in progress"),
    done: chalk.green("done"),

    // Feedback statuses
    new: chalk.cyan("new"),
    under_review: chalk.yellow("under review"),
    planned: chalk.blue("planned"),
    rejected: chalk.red("rejected"),

    // Changelog statuses
    draft: chalk.gray("draft"),
    published: chalk.green("published"),
  }

  return statusMap[status] || status
}

/**
 * Format priority with color
 */
export function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: chalk.gray("low"),
    medium: chalk.yellow("medium"),
    high: chalk.red("high"),
  }

  return priorityMap[priority] || priority
}

/**
 * Format date
 */
export function formatDate(value: number | string | undefined | null): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Format date with time
 */
export function formatDateTime(value: number | string | undefined | null): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + "..."
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}
