import Conf from "conf"
import path from "path"
import fs from "fs"

export interface Config {
  apiKey?: string
  baseUrl?: string
  defaultProject?: string
  outputFormat?: "table" | "json"
  noColor?: boolean
}

export const DEFAULT_BASE_URL = "http://localhost:3000"

export class ConfigManager {
  private globalConfig: Conf<Config>
  private localConfigPath: string
  private localConfig: Config | null

  constructor() {
    // Global config stored in ~/.projectify/config.json
    this.globalConfig = new Conf({
      projectName: "projectify",
      configName: "config",
    })

    // Local config in current directory .projectify/config.json
    this.localConfigPath = path.join(
      process.cwd(),
      ".projectify",
      "config.json"
    )
    this.localConfig = this.loadLocalConfig()
  }

  private loadLocalConfig(): Config | null {
    try {
      if (fs.existsSync(this.localConfigPath)) {
        const data = fs.readFileSync(this.localConfigPath, "utf-8")
        return JSON.parse(data)
      }
    } catch {
      // Ignore errors, return null if local config doesn't exist or is invalid
      return null
    }
    return null
  }

  private saveLocalConfig(config: Config): void {
    const dir = path.dirname(this.localConfigPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(this.localConfigPath, JSON.stringify(config, null, 2))
    this.localConfig = config
  }

  /**
   * Get a config value with local config taking precedence over global
   */
  get<K extends keyof Config>(key: K): Config[K] | undefined {
    // Reload local config to ensure we get latest values
    this.localConfig = this.loadLocalConfig()

    // Check local config first
    if (this.localConfig && this.localConfig[key] !== undefined) {
      return this.localConfig[key]
    }
    // Fall back to global config - conf auto-reloads from disk
    const value = this.globalConfig.get(key)
    return value
  }

  /**
   * Set a config value
   */
  set<K extends keyof Config>(
    key: K,
    value: Config[K],
    options?: { local?: boolean }
  ): void {
    if (options?.local) {
      // Set in local config
      const currentLocal = this.localConfig || {}
      this.saveLocalConfig({
        ...currentLocal,
        [key]: value,
      })
    } else {
      // Set in global config
      this.globalConfig.set(key, value)
    }
  }

  /**
   * Get all config values (merged, with local overriding global)
   */
  getAll(): Config {
    // Reload local config to ensure we get latest values
    this.localConfig = this.loadLocalConfig()

    const globalConfig = this.globalConfig.store
    const localConfig = this.localConfig || {}
    return {
      ...globalConfig,
      ...localConfig,
    }
  }

  /**
   * Delete a config key
   */
  delete(key: keyof Config, options?: { local?: boolean }): void {
    if (options?.local) {
      // Remove from local config
      if (this.localConfig) {
        const updated = { ...this.localConfig }
        delete updated[key]
        if (Object.keys(updated).length === 0) {
          // Remove the file if empty
          if (fs.existsSync(this.localConfigPath)) {
            fs.unlinkSync(this.localConfigPath)
          }
          this.localConfig = null
        } else {
          this.saveLocalConfig(updated)
        }
      }
    } else {
      // Remove from global config
      this.globalConfig.delete(key)
    }
  }

  /**
   * Clear all config (or just local/global)
   */
  clear(options?: { local?: boolean; global?: boolean }): void {
    if (options?.local && !options?.global) {
      // Clear only local
      if (fs.existsSync(this.localConfigPath)) {
        fs.unlinkSync(this.localConfigPath)
      }
      this.localConfig = null
    } else if (options?.global && !options?.local) {
      // Clear only global
      this.globalConfig.clear()
    } else {
      // Clear both
      this.globalConfig.clear()
      if (fs.existsSync(this.localConfigPath)) {
        fs.unlinkSync(this.localConfigPath)
      }
      this.localConfig = null
    }
  }

  /**
   * Get the path to the global config file
   */
  getGlobalConfigPath(): string {
    return this.globalConfig.path
  }

  /**
   * Get the path to the local config file
   */
  getLocalConfigPath(): string {
    return this.localConfigPath
  }

  /**
   * Check if local config exists
   */
  hasLocalConfig(): boolean {
    return this.localConfig !== null
  }
}

// Export a singleton instance
export const config = new ConfigManager()
