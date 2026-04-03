"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"
import { Label } from "@workspace/ui/components/label"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeleteFolderDialogProps {
  folderId: Id<"folders">
  folderName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteFolderDialog({
  folderId,
  folderName,
  open,
  onOpenChange,
  onSuccess,
}: DeleteFolderDialogProps) {
  const [deleteMode, setDeleteMode] = useState<"empty" | "recursive">("empty")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const deleteFolder = useMutation(api.folders.deleteFolder)
  const deleteFolderRecursive = useMutation(api.folders.deleteFolderRecursive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (deleteMode === "empty") {
        await deleteFolder({ folderId })
        toast.success("Folder deleted successfully")
      } else {
        await deleteFolderRecursive({ folderId })
        toast.success("Folder and all contents deleted successfully")
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to delete folder"
      
      if (errorMessage.includes("not empty")) {
        toast.error("Folder is not empty. Choose 'Delete folder and all contents' option or empty the folder first.")
      } else {
        toast.error(errorMessage)
      }
      
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{folderName}"?
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <RadioGroup value={deleteMode} onValueChange={(value: any) => setDeleteMode(value)}>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="empty" id="empty" />
                <Label htmlFor="empty" className="cursor-pointer font-normal">
                  <div className="font-medium">Delete if empty</div>
                  <p className="text-muted-foreground text-sm">
                    Only deletes the folder if it contains no files or subfolders
                  </p>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="recursive" id="recursive" />
                <Label htmlFor="recursive" className="cursor-pointer font-normal">
                  <div className="font-medium">Delete folder and all contents</div>
                  <p className="text-muted-foreground text-sm">
                    Permanently deletes the folder and everything inside it
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {deleteMode === "recursive" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. All files, links, and subfolders will be permanently deleted.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
