"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { toast } from "sonner"
import { Loader2, Users, LogOut, AlertTriangle } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"

function ProjectsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-2">
            <div className="h-5 w-48 animate-pulse bg-muted" />
            <div className="h-4 w-32 animate-pulse bg-muted" />
          </div>
          <div className="h-9 w-24 animate-pulse bg-muted" />
        </div>
      ))}
    </div>
  )
}

function ProjectsListEmpty() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card/50 p-8 text-center">
      <Users className="size-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        No projects yet
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        You&apos;re not a member of any projects yet
      </p>
    </div>
  )
}

export function ProjectsList() {
  const projects = useQuery(api.users.getUserProjects)
  const leaveProject = useMutation(api.users.leaveProject)
  const leaveAllProjects = useMutation(api.users.leaveAllProjects)

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaveAllDialogOpen, setLeaveAllDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<{
    id: Id<"projects">
    title: string
  } | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)

  const isLoading = projects === undefined

  const handleLeaveClick = (projectId: Id<"projects">, title: string) => {
    setSelectedProject({ id: projectId, title })
    setLeaveDialogOpen(true)
  }

  const handleLeaveProject = async () => {
    if (!selectedProject) return

    setIsLeaving(true)

    try {
      await leaveProject({ projectId: selectedProject.id })
      toast.success(`Left ${selectedProject.title} successfully!`)
      setLeaveDialogOpen(false)
      setSelectedProject(null)
    } catch (error) {
      console.error("Failed to leave project:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to leave project. Please try again."
      )
    } finally {
      setIsLeaving(false)
    }
  }

  const handleLeaveAll = async () => {
    setIsLeaving(true)

    try {
      const result = await leaveAllProjects()
      toast.success(`Left ${result.count} project${result.count !== 1 ? "s" : ""} successfully!`)
      setLeaveAllDialogOpen(false)
    } catch (error) {
      console.error("Failed to leave all projects:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to leave projects. Please try again."
      )
    } finally {
      setIsLeaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "development":
        return "bg-primary/10 text-primary"
      case "maintenance":
        return "bg-warning/10 text-warning"
      case "inactive":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-primary text-primary-foreground"
      case "admin":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                Projects you&apos;re a member of
              </CardDescription>
            </div>
            {projects && projects.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setLeaveAllDialogOpen(true)}
              >
                <LogOut className="mr-2 size-4" />
                Leave All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ProjectsListSkeleton />
          ) : !projects || projects.length === 0 ? (
            <ProjectsListEmpty />
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {project.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${getRoleBadge(project.role)}`}
                      >
                        {project.role}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${getStatusBadge(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{project.memberCount} member{project.memberCount !== 1 ? "s" : ""}</span>
                      <span>•</span>
                      <span className="line-clamp-1">{project.description}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLeaveClick(project._id, project.title)}
                  >
                    <LogOut className="mr-2 size-4" />
                    Leave
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Project Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave &quot;{selectedProject?.title}&quot;?
              {projects?.find((p) => p._id === selectedProject?.id)?.role === "owner" && (
                <span className="mt-2 block text-warning">
                  <AlertTriangle className="mr-1 inline size-4" />
                  You are an owner of this project. You may need to transfer ownership first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveProject}
              disabled={isLeaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Leave Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave All Projects Dialog */}
      <AlertDialog open={leaveAllDialogOpen} onOpenChange={setLeaveAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave All Projects?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave all {projects?.length} project{projects?.length !== 1 ? "s" : ""}?
              This action cannot be undone.
              {projects?.some((p) => p.role === "owner") && (
                <span className="mt-2 block text-warning">
                  <AlertTriangle className="mr-1 inline size-4" />
                  You are an owner of some projects. You may need to transfer ownership first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveAll}
              disabled={isLeaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Leave All Projects
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
