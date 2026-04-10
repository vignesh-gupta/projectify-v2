import chalk from "chalk"

export class CLIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CLIError"
  }
}

export class AuthError extends CLIError {
  constructor(message: string) {
    super(message)
    this.name = "AuthError"
  }
}

export class NetworkError extends CLIError {
  constructor(message: string) {
    super(message)
    this.name = "NetworkError"
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export class NotFoundError extends CLIError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`)
    this.name = "NotFoundError"
  }
}

/**
 * Handle and display errors in a user-friendly way
 */
export function handleError(error: unknown, verbose: boolean = false): never {
  if (error instanceof AuthError) {
    console.error(chalk.red("✖"), chalk.red("Authentication Error:"), error.message)
    console.error(chalk.yellow("\nTip: Run `pjfy auth login` to authenticate"))
    process.exit(1)
  }

  if (error instanceof ValidationError) {
    console.error(chalk.red("✖"), chalk.red("Validation Error:"), error.message)
    process.exit(1)
  }

  if (error instanceof NetworkError) {
    console.error(chalk.red("✖"), chalk.red("Network Error:"), error.message)
    console.error(
      chalk.yellow("\nTip: Check your internet connection and try again")
    )
    process.exit(1)
  }

  if (error instanceof NotFoundError) {
    console.error(chalk.red("✖"), error.message)
    process.exit(1)
  }

  if (error instanceof CLIError) {
    console.error(chalk.red("✖"), error.message)
    process.exit(1)
  }

  // Unknown error
  console.error(chalk.red("✖"), chalk.red("Unexpected Error:"))
  if (error instanceof Error) {
    console.error(error.message)
    if (verbose && error.stack) {
      console.error(chalk.gray("\nStack trace:"))
      console.error(chalk.gray(error.stack))
    }
  } else {
    console.error(String(error))
  }
  process.exit(1)
}

/**
 * Ensure user is authenticated
 */
export function requireAuth(config: { apiKey?: string }): string {
  if (!config.apiKey) {
    throw new AuthError(
      "Not authenticated. Run `pjfy auth login` to authenticate."
    )
  }
  return config.apiKey
}
