"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
import { AlertTriangle, Trash2, Loader2, Eraser } from "lucide-react"

interface DangerZoneProps {
  projectId: Id<"projects">
  projectTitle: string
  currentUserRole: "owner" | "admin" | "member"
}

export function DangerZone({
  projectId,
  projectTitle,
  currentUserRole,
}: DangerZoneProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const router = useRouter()
  const deleteProject = useMutation(api.projects.deleteProject)
  const clearProjectData = useMutation(api.projects.clearProjectData)

  const canDelete = currentUserRole === "owner" || currentUserRole === "admin"
  const isConfirmValid = confirmText === projectTitle

  const handleClearData = async () => {
    if (!isConfirmValid) return

    setIsClearing(true)

    try {
      const result = await clearProjectData({ projectId })
      toast.success(`Project data cleared! Removed ${result.cleared.tasks} tasks, ${result.cleared.resources} resources, and ${result.cleared.folders} folders.`)
      setConfirmText("")
      setClearDataDialogOpen(false)
    } catch (error) {
      console.error("Failed to clear project data:", error)
      const message = error instanceof Error ? error.message : "Failed to clear project data"
      toast.error(message)
    } finally {
      setIsClearing(false)
    }
  }

  const handleDelete = async () => {
    if (!isConfirmValid) return

    setIsDeleting(true)

    try {
      await deleteProject({ projectId })
      toast.success("Project deleted successfully")

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to delete project:", error)
      const message =
        error instanceof Error ? error.message : "Failed to delete project"
      toast.error(message)
      setIsDeleting(false)
    }
  }

  if (!canDelete) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="size-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Only project owners and admins can delete this project.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-orange-500/50 bg-orange-50/50 p-4 dark:bg-orange-950/20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-orange-600 dark:text-orange-400">
                  Clear All Data
                </h4>
                <p className="text-sm text-muted-foreground">
                  Remove all tasks, resources, and folders from this project. The project itself and team members will remain. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setClearDataDialogOpen(true)}
                className="shrink-0 border-orange-500 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/20"
              >
                <Eraser className="mr-2 size-4" />
                Clear Data
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-destructive">
                  Delete Project
                </h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this project and all associated data
                  including tasks, members, and resources. This action cannot be
                  undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="shrink-0"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block text-sm font-normal">
                This will permanently delete <strong>{projectTitle}</strong> and
                all associated data:
              </span>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>All tasks and work items</li>
                <li>All resources and files</li>
                <li>All team member associations</li>
                <li>All project folders</li>
              </ul>
              <p className="font-semibold text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="confirm-delete">
              Type{" "}
              <span className="font-mono font-semibold">{projectTitle}</span> to
              confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter project name"
              disabled={isDeleting}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => {
                setConfirmText("")
                setDeleteDialogOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!isConfirmValid || isDeleting}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Eraser className="size-5 text-orange-600" />
              Clear All Project Data
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will permanently delete all content from <strong>{projectTitle}</strong>:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>All tasks and work items</li>
                <li>All resources and files</li>
                <li>All project folders</li>
              </ul>
              <p>
                The project itself and team members will <strong>remain intact</strong>.
              </p>
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="confirm-clear">
              Type <span className="font-mono font-semibold">{projectTitle}</span> to
              confirm:
            </Label>
            <Input
              id="confirm-clear"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter project name"
              disabled={isClearing}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isClearing}
              onClick={() => {
                setConfirmText("")
                setClearDataDialogOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              disabled={!isConfirmValid || isClearing}
              className="border-orange-500 bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Eraser className="mr-2 size-4" />
                  Clear All Data
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
