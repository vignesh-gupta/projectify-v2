import type { Ora } from "ora"
import ora from "ora"

const MIN_SPINNER_MS = 300

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ensureMinDuration(startedAt: number): Promise<void> {
  const elapsed = Date.now() - startedAt
  if (elapsed < MIN_SPINNER_MS) {
    await sleep(MIN_SPINNER_MS - elapsed)
  }
}

export function startSpinner(text: string): { spinner: Ora; startedAt: number } {
  return {
    spinner: ora(text).start(),
    startedAt: Date.now(),
  }
}

export async function stopSpinner(spinner: Ora, startedAt: number): Promise<void> {
  await ensureMinDuration(startedAt)
  spinner.stop()
}

export async function succeedSpinner(
  spinner: Ora,
  startedAt: number,
  message: string
): Promise<void> {
  await ensureMinDuration(startedAt)
  spinner.succeed(message)
}

export async function failSpinner(
  spinner: Ora,
  startedAt: number,
  message: string
): Promise<void> {
  await ensureMinDuration(startedAt)
  spinner.fail(message)
}
