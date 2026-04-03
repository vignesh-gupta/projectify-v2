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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"

interface RenameFolderDialogProps {
  folderId: Id<"folders">
  currentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RenameFolderDialog({
  folderId,
  currentName,
  open,
  onOpenChange,
  onSuccess,
}: RenameFolderDialogProps) {
  const [folderName, setFolderName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFolder = useMutation(api.folders.updateFolder)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = folderName.trim()

    if (!trimmedName) {
      toast.error("Please enter a folder name")
      return
    }

    if (trimmedName === currentName) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)

    try {
      await updateFolder({
        folderId,
        name: trimmedName,
      })

      toast.success("Folder renamed successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Failed to rename folder")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFolderName(currentName)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for the folder.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">
                Folder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                required
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
