"use client"

import { useQuery, useMutation } from "convex/react"
import { useRouter, usePathname } from "next/navigation"
import { FolderPlus, Home } from "lucide-react"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
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
import { toast } from "sonner"

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
      router.push(`${pathname}?folderId=${targetFolderId}`)
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
      folderPath.forEach((folder: { _id: Id<"folders">; name: string }, index: number) => {
        const isLast = index === folderPath.length - 1

        items.push(<BreadcrumbSeparator key={`sep-${folder._id}`} />)

        items.push(
          <BreadcrumbItem key={folder._id}>
            {isLast ? (
              <BreadcrumbPage className="font-medium">
                {folder.name}
              </BreadcrumbPage>
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
      })
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
          <BreadcrumbPage className="font-medium">{last.name}</BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    return items
  }

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
