"use client"

import { useMutation } from "convex/react"
import { useState } from "react"
import { Plus } from "lucide-react"
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
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"

interface CreateLinkDialogProps {
  projectId: Id<"projects">
  folderId?: Id<"folders">
}

export function CreateLinkDialog({ projectId, folderId }: CreateLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

  const createLink = useMutation(api.resources.createLink)

  const getFavicon = (url: string) => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    } catch {
      return undefined
    }
  }

  const fetchPageTitle = async (urlString: string) => {
    try {
      setIsFetchingTitle(true)
      
      // Validate URL
      const urlObj = new URL(urlString)
      
      // Use a CORS proxy or meta tag service to fetch title
      // For now, just extract domain name as fallback
      const domain = urlObj.hostname.replace("www.", "")
      setName(domain.charAt(0).toUpperCase() + domain.slice(1))
      
      toast.info("Auto-filled name from URL")
    } catch (error) {
      console.error("Failed to fetch title:", error)
    } finally {
      setIsFetchingTitle(false)
    }
  }

  const handleUrlBlur = () => {
    if (url && !name) {
      fetchPageTitle(url)
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
      await createLink({
        projectId,
        name: name.trim(),
        url: url.trim(),
        favicon: getFavicon(url.trim()),
        folderId,
      })

      toast.success("Link added successfully")

      // Reset form
      setName("")
      setUrl("")
      setOpen(false)
    } catch (error) {
      toast.error("Failed to add link")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
            <DialogDescription>
              Save a useful link for your project. The name will be auto-filled from the URL.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter link name"
                required
                disabled={isSubmitting || isFetchingTitle}
              />
              {isFetchingTitle && (
                <p className="text-xs text-muted-foreground">Fetching title...</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
