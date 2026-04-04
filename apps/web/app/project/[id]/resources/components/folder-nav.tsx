"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useFolderId } from "@/hooks/nuqs/use-folder-id"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useMutation, useQuery } from "convex/react"
import { FolderPlus, Home, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { DeleteFolderDialog } from "./delete-folder-dialog"
import { RenameFolderDialog } from "./rename-folder-dialog"

interface FolderNavProps {
  projectId: Id<"projects">
  folderId?: Id<"folders">
  type: "file" | "link"
}

export function FolderNav({ projectId, folderId, type }: FolderNavProps) {
  const [open, setOpen] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { setFolderId } = useFolderId()

  const folderPath = useQuery(
    api.folders.getFolderPath,
    folderId ? { folderId } : {}
  )

  const createFolder = useMutation(api.folders.createFolder)

  const navigateToFolder = (targetFolderId?: Id<"folders">) => {
    if (!targetFolderId) {
      return
    }

    setFolderId(targetFolderId)
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

  // Render breadcrumb with ellipsis for deeply nested paths
  const renderBreadcrumbs = () => {
    if (!folderPath || folderPath.length === 0) {
      return (
        <BreadcrumbPage className="font-medium">
          <Home className="mr-1.5 inline h-4 w-4" />
          All {type === "file" ? "Files" : "Links"}
        </BreadcrumbPage>
      )
    }

    const items: React.ReactNode[] = []

    // Home link
    items.push(
      <BreadcrumbItem key="home">
        <BreadcrumbLink
          onClick={() => navigateToFolder()}
          className="cursor-pointer"
        >
          <Home className="h-4 w-4" />
        </BreadcrumbLink>
      </BreadcrumbItem>
    )

    // If path is <= 4 items, show all
    if (folderPath.length <= 4) {
      folderPath.forEach(
        (folder: { _id: Id<"folders">; name: string }, index: number) => {
          const isLast = index === folderPath.length - 1

          items.push(<BreadcrumbSeparator key={`sep-${folder._id}`} />)

          items.push(
            <BreadcrumbItem key={folder._id}>
              {isLast ? (
                <div className="flex items-center gap-2">
                  <BreadcrumbPage className="font-medium">
                    {folder.name}
                  </BreadcrumbPage>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3.5 w-3.5" />
                        <span className="sr-only">Folder actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setRenameDialogOpen(true)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <BreadcrumbLink
                  onClick={() => navigateToFolder(folder._id)}
                  className="cursor-pointer"
                >
                  {folder.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          )
        }
      )
    } else {
      // Show first, ellipsis with dropdown, and last
      const first = folderPath[0]
      const middle = folderPath.slice(1, -1)
      const last = folderPath[folderPath.length - 1]

      if (!first || !last) {
        return items
      }

      // First folder
      items.push(<BreadcrumbSeparator key="sep-first" />)
      items.push(
        <BreadcrumbItem key={first._id}>
          <BreadcrumbLink
            onClick={() => navigateToFolder(first._id)}
            className="cursor-pointer"
          >
            {first.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
      )

      // Ellipsis with dropdown for middle folders
      items.push(<BreadcrumbSeparator key="sep-ellipsis" />)
      items.push(
        <BreadcrumbItem key="ellipsis">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              <BreadcrumbEllipsis className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {middle.map((folder: { _id: Id<"folders">; name: string }) => (
                <DropdownMenuItem
                  key={folder._id}
                  onClick={() => navigateToFolder(folder._id)}
                >
                  {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      )

      // Last folder
      items.push(<BreadcrumbSeparator key="sep-last" />)
      items.push(
        <BreadcrumbItem key={last._id}>
          <div className="flex items-center gap-2">
            <BreadcrumbPage className="font-medium">{last.name}</BreadcrumbPage>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                  <span className="sr-only">Folder actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </BreadcrumbItem>
      )
    }

    return items
  }

  const handleDeleteSuccess = () => {
    // Navigate to parent folder after deletion
    if (folderPath && folderPath.length > 1) {
      const parentFolder = folderPath[folderPath.length - 2]
      if (parentFolder) {
        navigateToFolder(parentFolder._id)
      } else {
        navigateToFolder()
      }
    } else {
      // Navigate to root if we're deleting a top-level folder
      navigateToFolder()
    }
  }

  // Get current folder name for dialogs
  const currentFolder = folderPath?.[folderPath.length - 1]

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>{renderBreadcrumbs()}</BreadcrumbList>
      </Breadcrumb>

      {/* Create Folder Button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-106.25">
          <form onSubmit={handleCreateFolder}>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your{" "}
                {type === "file" ? "files" : "links"}.
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

      {/* Rename Folder Dialog */}
      {folderId && currentFolder && (
        <RenameFolderDialog
          folderId={folderId}
          currentName={currentFolder.name}
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
        />
      )}

      {/* Delete Folder Dialog */}
      {folderId && currentFolder && (
        <DeleteFolderDialog
          folderId={folderId}
          folderName={currentFolder.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
