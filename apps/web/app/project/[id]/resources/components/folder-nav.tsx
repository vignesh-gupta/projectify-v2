"use client"

import { useQuery, useMutation } from "convex/react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronRight, FolderPlus, Home } from "lucide-react"
import { useState } from "react"
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
import { cn } from "@workspace/ui/lib/utils"

interface FolderNavProps {
  projectId: Id<"projects">
  folderId?: Id<"folders">
  type: "file" | "link"
}

export function FolderNav({ projectId, folderId, type }: FolderNavProps) {
  const [open, setOpen] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const folderPath = useQuery(
    api.folders.getFolderPath,
    folderId ? { folderId } : "skip"
  )

  const createFolder = useMutation(api.folders.createFolder)

  const navigateToFolder = (targetFolderId?: Id<"folders">) => {
    if (targetFolderId) {
      router.push(`${pathname}?folder=${targetFolderId}`)
    } else {
      router.push(pathname)
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!folderName.trim()) {
      toast.error("Please enter a folder name")
      return
    }

    setIsSubmitting(true)

    try {
      await createFolder({
        projectId,
        name: folderName.trim(),
        type,
        parentId: folderId,
      })

      toast.success("Folder created successfully")
      setFolderName("")
      setOpen(false)
    } catch (error) {
      toast.error("Failed to create folder")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => navigateToFolder()}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted",
            !folderId && "bg-muted font-medium"
          )}
        >
          <Home className="h-4 w-4" />
          <span>All {type === "file" ? "Files" : "Links"}</span>
        </button>

        {folderPath && folderPath.length > 0 && (
          <>
            {folderPath.map((folder: { _id: Id<"folders">; name: string }, index: number) => (
              <div key={folder._id} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() => navigateToFolder(folder._id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted",
                    index === folderPath.length - 1 && "bg-muted font-medium"
                  )}
                >
                  <span>{folder.name}</span>
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Create Folder Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateFolder}>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your {type === "file" ? "files" : "links"}.
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
                />
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
                {isSubmitting ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
