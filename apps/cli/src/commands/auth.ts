import { Command } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"
import { apiClient } from "../api-client.js"
import { config, DEFAULT_BASE_URL } from "../config.js"
import { handleError } from "../errors.js"

interface ValidateResponse {
  valid: boolean
  user?: {
    id: string
    name?: string
    email?: string
  }
  error?: string
}

export function createAuthCommand(): Command {
  const auth = new Command("auth").description("Authentication commands")

  auth
    .command("login")
    .description("Authenticate with API key")
    .option("--local", "Store credentials in local config")
    .action(async (options, command) => {
      try {
        const currentBaseUrl = config.get("baseUrl") || DEFAULT_BASE_URL

        const answers = await inquirer.prompt([
          {
            type: "input",
            name: "baseUrl",
            message: "API base URL:",
            default: currentBaseUrl,
            validate: (value: string) =>
              value.trim().length > 0 || "Base URL is required",
          },
          {
            type: "password",
            name: "apiKey",
            mask: "*",
            message: "API key:",
            validate: (value: string) =>
              value.trim().length > 0 || "API key is required",
          },
        ])

        const baseUrl = String(answers.baseUrl).trim()
        const apiKey = String(answers.apiKey).trim()

        apiClient.setBaseUrl(baseUrl)
        await apiClient.validateApiKey(apiKey)

        const scope = options.local ? { local: true } : undefined
        config.set("baseUrl", baseUrl, scope)
        config.set("apiKey", apiKey, scope)

        const result = await apiClient.post<ValidateResponse>("/api/auth/validate", {
          apiKey,
        })

        console.log(chalk.green("✓"), "Authentication successful")
        if (result.user) {
          console.log(
            chalk.dim("User:"),
            result.user.name || "-",
            result.user.email ? `<${result.user.email}>` : ""
          )
        }
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  auth
    .command("logout")
    .description("Remove stored API credentials")
    .option("--local", "Remove only local config credentials")
    .option("--global", "Remove only global config credentials")
    .action((options, command) => {
      try {
        const hadApiKey = Boolean(config.get("apiKey"))
        if (options.local && !options.global) {
          config.delete("apiKey", { local: true })
        } else if (options.global && !options.local) {
          config.delete("apiKey")
        } else {
          config.delete("apiKey")
          config.delete("apiKey", { local: true })
        }

        if (hadApiKey) {
          console.log(chalk.green("✓"), "Logged out")
        } else {
          console.log(chalk.yellow("No stored API key found"))
        }
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  auth
    .command("status")
    .description("Show authentication status")
    .action(async (options, command) => {
      try {
        const apiKey = config.get("apiKey")
        const baseUrl = config.get("baseUrl") || DEFAULT_BASE_URL

        if (!apiKey) {
          console.log(chalk.yellow("Not authenticated"))
          console.log(chalk.dim(`Base URL: ${baseUrl}`))
          return
        }

        apiClient.setBaseUrl(baseUrl)
        const result = await apiClient.post<ValidateResponse>("/api/auth/validate", {
          apiKey,
        })

        if (!result.valid) {
          console.log(chalk.red("Authentication invalid"))
          console.log(chalk.dim(`Base URL: ${baseUrl}`))
          return
        }

        console.log(chalk.green("Authenticated"))
        console.log(chalk.dim(`Base URL: ${baseUrl}`))
        if (result.user) {
          console.log(
            chalk.dim("User:"),
            result.user.name || "-",
            result.user.email ? `<${result.user.email}>` : ""
          )
        }
      } catch (error) {
        handleError(error, command.parent?.opts().verbose)
      }
    })

  return auth
}
