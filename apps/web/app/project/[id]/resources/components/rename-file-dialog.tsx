"use client"

import { useMutation } from "convex/react"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
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

type Resource = Doc<"resources">

interface RenameFileDialogProps {
  resource: Resource
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameFileDialog({ resource, open, onOpenChange }: RenameFileDialogProps) {
  const [name, setName] = useState(resource.name)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateResource = useMutation(api.resources.update)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a file name")
      return
    }

    setIsSubmitting(true)

    try {
      await updateResource({
        resourceId: resource._id,
        name: name.trim(),
      })

      toast.success("File renamed successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to rename file")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>Enter a new name for this file.</DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">
                File Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="filename"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter file name"
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
              onClick={() => onOpenChange(false)}
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
