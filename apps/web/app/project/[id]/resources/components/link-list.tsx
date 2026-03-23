"use client"

import { useQuery, useMutation } from "convex/react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import {
  ExternalLink,
  Globe,
  MoreHorizontal,
  Trash2,
  Edit2,
  Folder,
} from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { CreateLinkDialog } from "./create-link-dialog"
import { EditLinkDialog } from "./edit-link-dialog"
import { DeleteResourceDialog } from "./delete-resource-dialog"
import { toast } from "sonner"

type Resource = Doc<"resources">

interface LinkListProps {
  projectId: Id<"projects">
  folderId?: Id<"folders">
  limit?: number
  hideFolders?: boolean
  showPath?: boolean
}

export function LinkList({
  projectId,
  folderId,
  limit,
  hideFolders = false,
}: LinkListProps) {
  const [editLink, setEditLink] = useState<Resource | null>(null)
  const [deleteLink, setDeleteLink] = useState<Resource | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [draggedIds, setDraggedIds] = useState<string[]>([])
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1)
  const router = useRouter()
  const pathname = usePathname()

  const moveResource = useMutation(api.resources.moveResource)
  const deleteResources = useMutation(api.resources.deleteResources)
  const deleteFolderRecursive = useMutation(api.folders.deleteFolderRecursive)

  const links = useQuery(api.resources.listByProject, {
    projectId,
    type: "link",
    folderId: folderId || null,
    limit,
  })

  const folders = useQuery(api.folders.listFolders, {
    projectId,
    type: "link",
    parentId: folderId ?? undefined,
  })

  const isLoading = links === undefined || folders === undefined

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleFolderClick = (
    targetFolderId: Id<"folders">,
    e: React.MouseEvent
  ) => {
    // Prevent navigation if dragging
    if (draggedIds.length > 0) {
      e.preventDefault()
      return
    }
    const basePath = pathname?.includes("/links")
      ? pathname
      : `${pathname}/links`
    router.push(`${basePath}?folder=${targetFolderId}`)
  }

  const handleLinkClick = (
    linkId: string,
    index: number,
    e: React.MouseEvent
  ) => {
    if (e.shiftKey && lastSelectedIndex !== -1 && links && links.length > 0) {
      // Range selection with Shift
      e.stopPropagation()
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const newSelected = new Set(selectedIds)

      for (let i = start; i <= end; i++) {
        const link = links[i]
        if (link) {
          newSelected.add(link._id)
        }
      }

      setSelectedIds(newSelected)
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      e.stopPropagation()
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(linkId)) {
          newSet.delete(linkId)
        } else {
          newSet.add(linkId)
        }
        return newSet
      })
      setLastSelectedIndex(index)
    } else {
      setLastSelectedIndex(index)
    }
  }

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} item(s)?`
    )

    if (!confirmed) return

    try {
      await deleteResources({
        resourceIds: Array.from(selectedIds) as Id<"resources">[],
      })
      toast.success(`Deleted ${selectedIds.size} item(s)`)
      setSelectedIds(new Set())
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete items")
    }
  }, [deleteResources, selectedIds])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault()
        if (links) {
          setSelectedIds(new Set(links.map((l) => l._id)))
        }
      }

      // Escape: Clear selection
      if (e.key === "Escape") {
        setSelectedIds(new Set())
      }

      // Delete: Delete selected
      if (e.key === "Delete" && selectedIds.size > 0) {
        e.preventDefault()
        handleBulkDelete()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleBulkDelete, links, selectedIds])

  // Delete folder with contents
  const handleDeleteFolder = async (folderId: Id<"folders">) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this folder and all its contents?"
    )

    if (!confirmed) return

    try {
      await deleteFolderRecursive({ folderId })
      toast.success("Folder deleted successfully")
    } catch (error) {
      console.error("Delete folder error:", error)
      toast.error("Failed to delete folder")
    }
  }

  const handleDragStart = (linkId: string, e: React.DragEvent) => {
    e.stopPropagation()

    // If dragging a selected item, drag all selected items
    let itemsToDrag: string[]
    if (selectedIds.has(linkId)) {
      itemsToDrag = Array.from(selectedIds)
    } else {
      // Otherwise, drag just this item
      itemsToDrag = [linkId]
      setSelectedIds(new Set([linkId]))
    }

    setDraggedIds(itemsToDrag)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", JSON.stringify(itemsToDrag))
  }

  const handleDragOver = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    setDragOverFolderId(targetFolderId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverFolderId(null)
  }

  const handleDrop = async (
    targetFolderId: Id<"folders">,
    e: React.DragEvent
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(null)

    try {
      const data = e.dataTransfer.getData("text/plain")
      const resourceIds = JSON.parse(data) as string[]

      // Move all resources to the target folder
      await Promise.all(
        resourceIds.map((id) =>
          moveResource({
            resourceId: id as Id<"resources">,
            folderId: targetFolderId,
          })
        )
      )

      toast.success(`Moved ${resourceIds.length} item(s) to folder`)
      setSelectedIds(new Set())
      setDraggedIds([])
    } catch (error) {
      console.error("Failed to move resources:", error)
      toast.error("Failed to move items")
    } finally {
      setDragOverFolderId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""}{" "}
              selected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Add Link Button */}
      <div className="flex items-center justify-between">
        <CreateLinkDialog projectId={projectId} folderId={folderId} />
      </div>

      {/* Link and Folder List */}
      <div className="space-y-2">
        {/* Show folders */}
        {!hideFolders &&
          folders &&
          folders.length > 0 &&
          folders.map((folder) => (
            <Card
              key={folder._id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                draggedIds.length > 0 && "ring-2 ring-primary/30",
                dragOverFolderId === folder._id &&
                  "scale-[1.02] bg-primary/5 ring-4 ring-primary"
              )}
              onClick={(e) => handleFolderClick(folder._id, e)}
              onDragOver={(e) => handleDragOver(e, folder._id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(folder._id, e)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium">{folder.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {draggedIds.length > 0 ? "Drop here to move" : "Folder"}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFolder(folder._id)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}

        {links && links.length === 0 && folders && folders.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No links saved yet
              </p>
            </CardContent>
          </Card>
        ) : (
          links?.map((link, index) => (
            <Card
              key={link._id}
              className={cn(
                "cursor-move transition-shadow hover:shadow-md",
                selectedIds.has(link._id) && "ring-2 ring-primary"
              )}
              draggable
              onDragStart={(e) => handleDragStart(link._id, e)}
              onClick={(e) => handleLinkClick(link._id, index, e)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenLink(link.url || "")
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {link.favicon ? (
                      <Image
                        src={link.favicon}
                        alt={link.name}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          )
                        }}
                      />
                    ) : null}
                    <Globe
                      className={cn(
                        "h-5 w-5 text-muted-foreground",
                        link.favicon && "hidden"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-medium">{link.name}</h4>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {link.url || ""}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleOpenLink(link.url || "")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditLink(link)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteLink(link)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editLink && (
        <EditLinkDialog
          resource={editLink}
          open={!!editLink}
          onOpenChange={(open) => !open && setEditLink(null)}
        />
      )}

      {deleteLink && (
        <DeleteResourceDialog
          resource={deleteLink}
          open={!!deleteLink}
          onOpenChange={(open) => !open && setDeleteLink(null)}
        />
      )}
    </div>
  )
}
