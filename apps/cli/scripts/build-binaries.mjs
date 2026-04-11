/* global process */
import { mkdirSync, rmSync } from "node:fs"
import { spawnSync } from "node:child_process"

const builds = [
  { target: "node18-win-x64", output: "releases/pjfy-win-x64.exe" },
  { target: "node18-macos-x64", output: "releases/pjfy-macos-x64" },
  { target: "node18-linux-x64", output: "releases/pjfy-linux-x64" },
]

mkdirSync("releases", { recursive: true })
rmSync("releases/index-win.exe", { force: true })
rmSync("releases/index-macos", { force: true })
rmSync("releases/index-linux", { force: true })

for (const build of builds) {
  const result = spawnSync(
    "pnpm",
    ["exec", "pkg", "dist/index.cjs", "--targets", build.target, "--output", build.output],
    { stdio: "inherit", shell: process.platform === "win32" }
  )

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
