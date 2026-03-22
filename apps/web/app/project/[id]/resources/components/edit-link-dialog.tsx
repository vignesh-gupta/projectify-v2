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

interface EditLinkDialogProps {
  resource: Resource
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditLinkDialog({ resource, open, onOpenChange }: EditLinkDialogProps) {
  const [name, setName] = useState(resource.name)
  const [url, setUrl] = useState(resource.url || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateResource = useMutation(api.resources.update)

  const getFavicon = (urlString: string) => {
    try {
      const urlObj = new URL(urlString)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    } catch {
      return undefined
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !url.trim()) {
      toast.error("Please enter both name and URL")
      return
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    setIsSubmitting(true)

    try {
      await updateResource({
        resourceId: resource._id,
        name: name.trim(),
        url: url.trim(),
        favicon: getFavicon(url.trim()),
      })

      toast.success("Link updated successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update link")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update the link name or URL.</DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter link name"
                required
                disabled={isSubmitting}
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
