import inquirer from "inquirer"

/**
 * Prompt for project creation
 */
export async function promptProjectCreate(): Promise<{
  title: string
  description: string
  status: "development" | "maintenance" | "inactive"
  dueDate?: number
}> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "Project title:",
      validate: (input: string) =>
        input.trim().length > 0 || "Title cannot be empty",
    },
    {
      type: "input",
      name: "description",
      message: "Description:",
      validate: (input: string) =>
        input.trim().length > 0 || "Description cannot be empty",
    },
    {
      type: "list",
      name: "status",
      message: "Status:",
      choices: ["development", "maintenance", "inactive"],
      default: "development",
    },
    {
      type: "input",
      name: "dueDate",
      message: "Due date (YYYY-MM-DD, optional):",
      validate: (input: string) => {
        if (!input) return true
        const date = new Date(input)
        return !isNaN(date.getTime()) || "Invalid date format"
      },
      filter: (input: string) => {
        if (!input) return undefined
        return new Date(input).getTime()
      },
    },
  ])

  return answers
}

/**
 * Prompt for task creation
 */
export async function promptTaskCreate(): Promise<{
  title: string
  description?: string
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  dueDate?: number
}> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: "Task title:",
      validate: (input: string) =>
        input.trim().length > 0 || "Title cannot be empty",
    },
    {
      type: "input",
      name: "description",
      message: "Description (optional):",
    },
    {
      type: "list",
      name: "status",
      message: "Status:",
      choices: ["todo", "in_progress", "done"],
      default: "todo",
    },
    {
      type: "list",
      name: "priority",
      message: "Priority:",
      choices: ["low", "medium", "high"],
      default: "medium",
    },
    {
      type: "input",
      name: "dueDate",
      message: "Due date (YYYY-MM-DD, optional):",
      validate: (input: string) => {
        if (!input) return true
        const date = new Date(input)
        return !isNaN(date.getTime()) || "Invalid date format"
      },
      filter: (input: string) => {
        if (!input) return undefined
        return new Date(input).getTime()
      },
    },
  ])

  return answers
}

/**
 * Prompt for confirmation
 */
export async function promptConfirm(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: false,
    },
  ])
  return confirmed
}

/**
 * Prompt for text input
 */
export async function promptText(
  message: string,
  options?: {
    default?: string
    validate?: (input: string) => boolean | string
  }
): Promise<string> {
  const { text } = await inquirer.prompt([
    {
      type: "input",
      name: "text",
      message,
      default: options?.default,
      validate: options?.validate,
    },
  ])
  return text
}

/**
 * Prompt for selection from list
 */
export async function promptSelect<T extends string>(
  message: string,
  choices: T[],
  defaultValue?: T
): Promise<T> {
  const { selected } = await inquirer.prompt([
    {
      type: "list",
      name: "selected",
      message,
      choices,
      default: defaultValue,
    },
  ])
  return selected
}
