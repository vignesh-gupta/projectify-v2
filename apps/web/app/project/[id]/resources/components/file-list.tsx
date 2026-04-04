"use client"

import { FilePreviewDialog } from "@/components/file-preview-dialog"
import { useMutation, useQuery } from "convex/react"
import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Upload,
  MoreHorizontal,
  Download,
  Trash2,
  Edit2,
  Folder,
  Eye,
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
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"
import { RenameFileDialog } from "./rename-file-dialog"
import { DeleteResourceDialog } from "./delete-resource-dialog"
import { UploadProgressPanel, type UploadItem } from "./upload-progress-panel"
import { FOLDER_ID_QUERY_KEY, useFolderId } from "@/hooks/nuqs/use-folder-id"

type Resource = Doc<"resources">

// Helper functions
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return "🖼️"
  if (fileType.startsWith("video/")) return "🎥"
  if (fileType.startsWith("audio/")) return "🎵"
  if (fileType.includes("pdf")) return "📄"
  if (fileType.includes("document") || fileType.includes("word")) return "📝"
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return "📊"
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return "📽️"
  if (fileType.includes("zip") || fileType.includes("rar")) return "🗜️"
  return "📎"
}

// Helper function to format folder path with ellipsis
const formatFolderPath = (
  path: Array<{ _id: Id<"folders">; name: string }>
): string => {
  if (path.length === 0) return ""
  if (path.length <= 4) {
    return path.map((f) => f.name).join(" > ")
  }
  // If more than 4, show first and last with ellipsis
  const first = path[0]
  const last = path[path.length - 1]
  if (!first || !last) return ""
  return `${first.name} > ... > ${last.name}`
}

// Component to display file card with optional folder path
interface FileCardProps {
  file: Resource
  index: number
  showPath: boolean
  selectedIds: Set<string>
  onDragStart: (fileId: string, e: React.DragEvent) => void
  onClick: (fileId: string, index: number, e: React.MouseEvent) => void
  onViewInPath: (folderId: Id<"folders"> | undefined) => void
  onDownload: (storageId: Id<"_storage">) => void
  onPreview: (file: Resource) => void
  onRename: (file: Resource) => void
  onDelete: (file: Resource) => void
}

function FileCardWithPath({
  file,
  index,
  showPath,
  selectedIds,
  onDragStart,
  onClick,
  onViewInPath,
  onDownload,
  onPreview,
  onRename,
  onDelete,
}: FileCardProps) {
  // Fetch folder path only if showPath is true and file has a folderId
  const folderPath = useQuery(api.folders.getFolderPath, {
    folderId: file.folderId,
    skipFiles: !showPath,
  })

  const pathText = showPath && folderPath ? formatFolderPath(folderPath) : ""

  return (
    <Card
      key={file._id}
      className={cn(
        "cursor-move transition-shadow hover:shadow-md",
        selectedIds.has(file._id) && "ring-2 ring-primary",
        {
          "py-2": showPath,
        }
      )}
      draggable
      onDragStart={(e) => onDragStart(file._id, e)}
      onClick={(e) => onClick(file._id, index, e)}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
            {getFileIcon(file.fileType || "")}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium">{file.name}</h4>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.fileSize || 0)} •{" "}
              {new Date(file.createdAt).toLocaleDateString()}
            </p>
            {showPath && pathText && (
              <p className="truncate text-xs text-muted-foreground/70">
                📁 {pathText}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showPath && (
              <>
                <DropdownMenuItem onClick={() => onViewInPath(file.folderId)}>
                  <Folder className="mr-2 h-4 w-4" />
                  View in Path
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => file.storageId && onDownload(file.storageId)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            {file.storageId && (
              <DropdownMenuItem onClick={() => onPreview(file)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onRename(file)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(file)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}

interface FileListProps {
  projectId: Id<"projects">
  folderId?: Id<"folders">
  limit?: number
  hideFolders?: boolean
  showPath?: boolean
  showAll?: boolean
}

export interface FileListHandle {
  uploadFiles: (files: File[]) => void
}

export const FileList = forwardRef<FileListHandle, FileListProps>(
  (
    {
      projectId,
      folderId,
      limit,
      hideFolders = false,
      showPath = false,
      showAll = false,
    },
    ref
  ) => {
    const [renameFile, setRenameFile] = useState<Resource | null>(null)
    const [deleteFile, setDeleteFile] = useState<Resource | null>(null)
    const [downloadingFile, setDownloadingFile] =
      useState<Id<"_storage"> | null>(null)
    const [previewingFile, setPreviewingFile] = useState<Resource | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [draggedIds, setDraggedIds] = useState<string[]>([])
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(
      null
    )
    const [uploads, setUploads] = useState<UploadItem[]>([])
    const [abortControllers, setAbortControllers] = useState<
      Map<string, AbortController>
    >(new Map())
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1)
    const router = useRouter()
    const pathname = usePathname()
    const { setFolderId } = useFolderId()

    const files = useQuery(api.resources.listByProject, {
      projectId,
      type: "file",
      folderId,
      limit,
      showAll,
    })

    const folders = useQuery(api.folders.listFolders, {
      projectId,
      type: "file",
      parentId: folderId ?? undefined,
      hideFolders,
    })

    const generateUploadUrl = useMutation(api.resources.generateUploadUrl)
    const createFile = useMutation(api.resources.createFile)
    const moveResource = useMutation(api.resources.moveResource)
    const deleteResources = useMutation(api.resources.deleteResources)
    const deleteFolderRecursive = useMutation(api.folders.deleteFolderRecursive)

    // Conditionally fetch file URL for download
    const fileUrl = useQuery(
      api.resources.getFileUrl,
      downloadingFile ? { storageId: downloadingFile } : "skip"
    )
    const previewUrl = useQuery(
      api.resources.getFileUrl,
      previewingFile?.storageId
        ? { storageId: previewingFile.storageId }
        : "skip"
    )

    const handleFileUpload = async (file: File) => {
      const uploadId = `${Date.now()}-${file.name}`
      const abortController = new AbortController()

      // Add to abort controllers map
      setAbortControllers((prev) =>
        new Map(prev).set(uploadId, abortController)
      )

      // Add to uploads list
      setUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          name: file.name,
          progress: 0,
          status: "uploading",
          size: file.size,
        },
      ])

      try {
        // Get upload URL
        const uploadUrl = await generateUploadUrl()

        // Upload the file with progress
        const xhr = new XMLHttpRequest()

        // Handle abort
        abortController.signal.addEventListener("abort", () => {
          xhr.abort()
        })

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100)
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { ...u, progress: percentComplete } : u
              )
            )
          }
        })

        await new Promise<string>((resolve, reject) => {
          xhr.open("POST", uploadUrl)
          xhr.setRequestHeader("Content-Type", file.type)

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve(xhr.responseText)
            } else {
              reject(new Error("Upload failed"))
            }
          }

          xhr.onerror = () => reject(new Error("Upload failed"))
          xhr.onabort = () => reject(new Error("Upload cancelled"))
          xhr.send(file)
        })

        const result = JSON.parse(xhr.responseText)
        const { storageId } = result

        // Create resource record
        await createFile({
          projectId,
          name: file.name,
          storageId,
          fileType: file.type,
          fileSize: file.size,
          folderId,
        })

        // Mark as complete
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, progress: 100, status: "complete" as const }
              : u
          )
        )

        // Auto-dismiss after 1 seconds
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== uploadId))
          setAbortControllers((prev) => {
            const newMap = new Map(prev)
            newMap.delete(uploadId)
            return newMap
          })
        }, 1000)
      } catch (error) {
        console.error("Upload error:", error)

        // Check if it was cancelled
        const wasCancelled =
          error instanceof Error && error.message === "Upload cancelled"

        if (wasCancelled) {
          // Remove from list immediately if cancelled
          setUploads((prev) => prev.filter((u) => u.id !== uploadId))
        } else {
          // Mark as error
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, status: "error" as const } : u
            )
          )
        }

        setAbortControllers((prev) => {
          const newMap = new Map(prev)
          newMap.delete(uploadId)
          return newMap
        })
      }
    }

    // Handle cancel upload
    const handleCancelUpload = (uploadId: string) => {
      const controller = abortControllers.get(uploadId)
      if (controller) {
        controller.abort()
      }
    }

    // Handle dismiss upload (for completed/error)
    const handleDismissUpload = (uploadId: string) => {
      setUploads((prev) => prev.filter((u) => u.id !== uploadId))
      setAbortControllers((prev) => {
        const newMap = new Map(prev)
        newMap.delete(uploadId)
        return newMap
      })
    }

    // Expose upload function to parent via ref
    useImperativeHandle(ref, () => ({
      uploadFiles: (filesToUpload: File[]) => {
        filesToUpload.forEach(handleFileUpload)
      },
    }))

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles) {
        Array.from(selectedFiles).forEach(handleFileUpload)
      }
    }

    const handleFolderClick = (
      targetFolderId: Id<"folders">,
      event?: React.MouseEvent
    ) => {
      // Don't navigate if Ctrl is pressed
      if (event?.ctrlKey || event?.metaKey) {
        return
      }

      setFolderId(targetFolderId)
    }

    const handleFileClick = (
      fileId: string,
      index: number,
      event: React.MouseEvent
    ) => {
      if (
        event.shiftKey &&
        lastSelectedIndex !== -1 &&
        files &&
        files.length > 0
      ) {
        // Range selection with Shift
        event.stopPropagation()
        const start = Math.min(lastSelectedIndex, index)
        const end = Math.max(lastSelectedIndex, index)
        const newSelected = new Set(selectedIds)

        for (let i = start; i <= end; i++) {
          const file = files[i]
          if (file) {
            newSelected.add(file._id)
          }
        }

        setSelectedIds(newSelected)
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle selection
        event.stopPropagation()
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(fileId)) {
            next.delete(fileId)
          } else {
            next.add(fileId)
          }
          return next
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
    }, [selectedIds, deleteResources])

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl+A: Select all
        if ((e.ctrlKey || e.metaKey) && e.key === "a") {
          e.preventDefault()
          if (files) {
            setSelectedIds(new Set(files.map((f) => f._id)))
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
    }, [files, handleBulkDelete, selectedIds])

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

    // Navigate to file location in folder structure
    const handleViewInPath = (fileFolderId?: Id<"folders">) => {
      const basePath = pathname?.includes("/files")
        ? pathname.split("?")[0]
        : `${pathname}/files`
      if (!basePath) return

      if (fileFolderId) {
        router.push(`${basePath}?${FOLDER_ID_QUERY_KEY}=${fileFolderId}`)
      } else {
        router.push(basePath)
      }
    }

    const handleDragStart = (id: string, event: React.DragEvent) => {
      // If dragging a selected item, drag all selected items
      const itemsToDrag = selectedIds.has(id) ? Array.from(selectedIds) : [id]
      setDraggedIds(itemsToDrag)
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/plain", JSON.stringify(itemsToDrag))
    }

    const handleDragOver = (event: React.DragEvent, targetFolderId: string) => {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = "move"
      setDragOverFolderId(targetFolderId)
    }

    const handleDragLeave = (event: React.DragEvent) => {
      event.preventDefault()
      setDragOverFolderId(null)
    }

    const handleDrop = async (
      targetFolderId: Id<"folders"> | undefined,
      event: React.DragEvent
    ) => {
      event.preventDefault()
      event.stopPropagation()
      setDragOverFolderId(null)

      try {
        const data = event.dataTransfer.getData("text/plain")
        const resourceIds = JSON.parse(data) as string[]

        // Move all dragged resources
        await Promise.all(
          resourceIds.map((id) =>
            moveResource({
              resourceId: id as Id<"resources">,
              folderId: targetFolderId,
            })
          )
        )

        toast.success(
          `Moved ${resourceIds.length} item${resourceIds.length > 1 ? "s" : ""}`
        )
        setSelectedIds(new Set())
        setDraggedIds([])
      } catch (error) {
        console.error("Move error:", error)
        toast.error("Failed to move items")
      } finally {
        setDragOverFolderId(null)
      }
    }

    // Handle file download by fetching URL when needed
    useEffect(() => {
      if (fileUrl && downloadingFile) {
        const link = document.createElement("a")
        link.href = fileUrl
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.click()
        setDownloadingFile(null)
        toast.success("Download started")
      }
    }, [fileUrl, downloadingFile])

    const handleDownload = (storageId: Id<"_storage">) => {
      setDownloadingFile(storageId)
    }

    const isLoading = files === undefined || folders === undefined

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
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex items-center justify-between">
          <input
            type="file"
            multiple
            onChange={handleInputChange}
            className="hidden"
            id="file-input"
          />
          <Button asChild size="sm">
            <label htmlFor="file-input" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </label>
          </Button>
          {selectedIds.size > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </p>
          )}
        </div>

        {/* File and Folder List */}
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

          {/* Show files */}
          {files && files.length === 0 && folders && folders.length === 0 ? (
            <Card>
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No files uploaded yet
                </p>
              </CardContent>
            </Card>
          ) : (
            files?.map((file, index) => (
              <FileCardWithPath
                key={file._id}
                file={file}
                index={index}
                showPath={showPath}
                selectedIds={selectedIds}
                onDragStart={handleDragStart}
                onClick={handleFileClick}
                onViewInPath={handleViewInPath}
                onDownload={handleDownload}
                onPreview={setPreviewingFile}
                onRename={setRenameFile}
                onDelete={setDeleteFile}
              />
            ))
          )}
        </div>

        {renameFile && (
          <RenameFileDialog
            resource={renameFile}
            open={!!renameFile}
            onOpenChange={(open) => !open && setRenameFile(null)}
          />
        )}

        {deleteFile && (
          <DeleteResourceDialog
            resource={deleteFile}
            open={!!deleteFile}
            onOpenChange={(open) => !open && setDeleteFile(null)}
          />
        )}

        {/* Upload Progress Panel */}
        <UploadProgressPanel
          uploads={uploads}
          onCancel={handleCancelUpload}
          onDismiss={handleDismissUpload}
        />

        <FilePreviewDialog
          open={Boolean(previewingFile && previewUrl)}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewingFile(null)
            }
          }}
          file={
            previewingFile && previewUrl
              ? {
                  name: previewingFile.name,
                  type: previewingFile.fileType || "",
                  url: previewUrl,
                  size: previewingFile.fileSize,
                }
              : null
          }
        />
      </div>
    )
  }
)

FileList.displayName = "FileList"

export { FileList as default }
