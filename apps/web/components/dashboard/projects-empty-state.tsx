"use client"

import { Button } from "@workspace/ui/components/button"
import { FolderOpen, Plus } from "lucide-react"

interface ProjectsEmptyStateProps {
  onCreateProject?: () => void
}

export function ProjectsEmptyState({
  onCreateProject,
}: ProjectsEmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="size-10 text-muted-foreground" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-foreground">
        No projects yet
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Get started by creating your first project. Organize your work, track
        progress, and collaborate with your team.
      </p>
      <Button className="mt-6 gap-2" onClick={onCreateProject}>
        <Plus className="size-4" />
        Create Your First Project
      </Button>
    </div>
  )
}
