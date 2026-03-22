"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
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

type Resource = Doc<"resources">

interface DeleteResourceDialogProps {
  resource: Resource
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteResourceDialog({ resource, open, onOpenChange }: DeleteResourceDialogProps) {
  const removeResource = useMutation(api.resources.remove)

  const handleDelete = async () => {
    try {
      await removeResource({ resourceId: resource._id })
      toast.success(`${resource.type === "file" ? "File" : "Link"} deleted successfully`)
      onOpenChange(false)
    } catch (error) {
      toast.error(`Failed to delete ${resource.type}`)
      console.error(error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {resource.type === "file" ? "File" : "Link"}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{resource.name}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
