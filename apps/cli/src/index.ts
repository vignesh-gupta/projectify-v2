#!/usr/bin/env node

import { Command } from "commander"
import chalk from "chalk"
import { createAuthCommand } from "./commands/auth.js"
import { createProjectCommand, createProjectsCommand } from "./commands/projects.js"
import { createTasksCommand } from "./commands/tasks.js"
import { createConfigCommand } from "./commands/config.js"

const program = new Command()

program
  .name("pjfy")
  .description("Projectify CLI - Manage your projects and tasks from the terminal")
  .version("1.0.0")

// Global options
program
  .option("--json", "Output in JSON format")
  .option("--no-color", "Disable colored output")
  .option("--project <id>", "Specify project context")
  .option("--verbose", "Show detailed output")

// Add commands
program.addCommand(createAuthCommand())
program.addCommand(createConfigCommand())
program.addCommand(createProjectsCommand())
program.addCommand(createProjectCommand())
program.addCommand(createTasksCommand())

// Help text
program.addHelpText(
  "after",
  `
${chalk.bold("Examples:")}
  $ pjfy auth login                          # Authenticate with Projectify
  $ pjfy auth status                         # Check authentication status
  $ pjfy config set defaultProject <id>      # Set default project
  $ pjfy projects                             # Select and save default project
  $ pjfy project use <id>                     # Set default project by ID
  $ pjfy projects list                       # List all projects
  $ pjfy projects create --interactive       # Create a project (interactive)
  $ pjfy tasks list --project <id>           # List tasks for a project
  $ pjfy tasks create --interactive          # Create a task (interactive)
  $ pjfy tasks list --json                   # List tasks in JSON format

${chalk.bold("Documentation:")}
  See CLI-PRD.md for full documentation
`
)

program.parse()
