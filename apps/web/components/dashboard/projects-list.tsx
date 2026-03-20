"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { FolderOpen, Plus, Search, Users } from "lucide-react"
import { motion } from "motion/react"
import { ProjectCard, Project } from "./project-card"
import { AddProjectButton } from "./add-project-button"

interface ProjectsListProps {
  projects: Project[]
  isLoading?: boolean
  error?: Error | null
  onCreateProject?: () => void
  onProjectClick?: (project: Project) => void
}

interface ProjectsListSkeletonProps {
  count?: number
}

export function ProjectsListSkeleton({ count = 3 }: ProjectsListSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-80 border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="size-12 animate-pulse bg-muted" />
            <div className="h-5 w-16 animate-pulse bg-muted" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-5 w-3/4 animate-pulse bg-muted" />
            <div className="h-4 w-full animate-pulse bg-muted" />
            <div className="h-4 w-5/6 animate-pulse bg-muted" />
          </div>
          <div className="mt-8 space-y-2">
            <div className="h-1.5 w-full animate-pulse bg-muted" />
            <div className="flex justify-between">
              <div className="h-6 w-20 animate-pulse bg-muted" />
              <div className="h-4 w-16 animate-pulse bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProjectsListError({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
      <p className="text-sm text-destructive">
        Failed to load projects: {error.message}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Please try again or contact support if the problem persists.
      </p>
    </div>
  )
}

export function ProjectsList({
  projects,
  isLoading,
  error,
  onCreateProject,
  onProjectClick,
}: ProjectsListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-wider text-muted-foreground uppercase">
            Active Projects
          </h2>
        </div>
        <ProjectsListSkeleton count={projects.length || 3} />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-wider text-muted-foreground uppercase">
            Active Projects
          </h2>
        </div>
        <ProjectsListError error={error} />
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return <ProjectsEmptyState onCreateProject={onCreateProject} />
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <motion.h2
          className="text-xl font-semibold tracking-wider text-muted-foreground uppercase"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Active Projects
        </motion.h2>
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter projects"
              className="w-64 bg-input pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="size-4" />
            SORT BY
          </Button>
        </motion.div>
      </div>

      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={onProjectClick}
          />
        ))}
        <AddProjectButton onClick={onCreateProject} />
      </motion.div>
    </div>
  )
}

interface ProjectsEmptyStateProps {
  onCreateProject?: () => void
}

export function ProjectsEmptyState({
  onCreateProject,
}: ProjectsEmptyStateProps) {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card/50 px-6 py-12 text-center">
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
