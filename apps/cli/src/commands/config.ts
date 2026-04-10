import { Command } from "commander"
import chalk from "chalk"
import { config } from "../config.js"
import { handleError } from "../errors.js"

export function createConfigCommand(): Command {
  const configCmd = new Command("config")
    .description("Manage CLI configuration")

  // Set config value
  configCmd
    .command("set <key> <value>")
    .description("Set a configuration value")
    .option("--local", "Set in local config")
    .option("--global", "Set in global config (default)")
    .action((key, value, options) => {
      try {
        config.set(key as any, value, { local: options.local })
        const location = options.local ? "local" : "global"
        console.log(chalk.green("✓"), `Config updated (${location}):`, chalk.cyan(`${key}=${value}`))
      } catch (error) {
        handleError(error)
      }
    })

  // Get config value
  configCmd
    .command("get <key>")
    .description("Get a configuration value")
    .action((key) => {
      try {
        const value = config.get(key as any)
        if (value === undefined) {
          console.log(chalk.yellow("⚠"), `Config key "${key}" not found`)
        } else {
          console.log(value)
        }
      } catch (error) {
        handleError(error)
      }
    })

  // List all config
  configCmd
    .command("list")
    .alias("ls")
    .description("List all configuration values")
    .action(() => {
      try {
        const allConfig = config.getAll()
        console.log(chalk.bold("\nConfiguration:\n"))
        
        Object.entries(allConfig).forEach(([key, value]) => {
          // Mask API key
          const displayValue = key === "apiKey" && typeof value === "string"
            ? value.substring(0, 10) + "..." + value.substring(value.length - 4)
            : value
          console.log(chalk.cyan(`${key}:`), chalk.dim(String(displayValue)))
        })

        console.log(chalk.dim("\nConfig file:"), config.hasLocalConfig() 
          ? config.getLocalConfigPath() + " (local)"
          : config.getGlobalConfigPath() + " (global)")
      } catch (error) {
        handleError(error)
      }
    })

  return configCmd
}
