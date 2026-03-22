"use client"

import { useMutation, useQuery } from "convex/react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Upload, MoreHorizontal, Download, Trash2, Edit2, File as FileIcon, CheckCircle2, Folder } from "lucide-react"
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
import { Progress } from "@workspace/ui/components/progress"
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"
import { RenameFileDialog } from "./rename-file-dialog"
import { DeleteResourceDialog } from "./delete-resource-dialog"
import type { UploadingFile } from "./drop-zone-wrapper"

type Resource = Doc<"resources">

interface FileListProps {
  projectId: Id<"projects">
  folderId?: Id<"folders">
  limit?: number
  onFileUpload?: (files: File[]) => void
}

export function FileList({ projectId, folderId, limit, onFileUpload }: FileListProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [renameFile, setRenameFile] = useState<Resource | null>(null)
  const [deleteFile, setDeleteFile] = useState<Resource | null>(null)
  const [downloadingFile, setDownloadingFile] = useState<Id<"_storage"> | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const files = useQuery(api.resources.listByProject, {
    projectId,
    type: "file",
    folderId: folderId || null,
    limit,
  })
  
  const folders = useQuery(api.folders.listFolders, {
    projectId,
    type: "file",
    parentId: folderId ?? undefined,
  })
  
  const generateUploadUrl = useMutation(api.resources.generateUploadUrl)
  const createFile = useMutation(api.resources.createFile)
  
  // Conditionally fetch file URL for download
  const fileUrl = useQuery(
    api.resources.getFileUrl,
    downloadingFile ? { storageId: downloadingFile } : "skip"
  )

  const simulateProgress = (fileName: string) => {
    return new Promise<void>((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5 // Random increment between 5-20%
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          resolve()
        }
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.name === fileName ? { ...f, progress: Math.min(progress, 100) } : f
          )
        )
      }, 150)
    })
  }

  const handleFileUpload = async (file: File) => {
    // Add file to uploading list
    setUploadingFiles((prev) => [
      ...prev,
      { name: file.name, progress: 0, status: "uploading" },
    ])

    try {
      // Start progress simulation
      const progressPromise = simulateProgress(file.name)

      // Get upload URL
      const uploadUrl = await generateUploadUrl()

      // Upload the file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!result.ok) {
        throw new Error("Upload failed")
      }

      const { storageId } = await result.json()

      // Wait for progress to complete
      await progressPromise

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
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, status: "complete", progress: 100 } : f
        )
      )

      toast.success(`${file.name} uploaded successfully`)

      // Remove from list after 2 seconds
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name))
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, status: "error", progress: 0 } : f
        )
      )
      toast.error(`Failed to upload ${file.name}`)

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name))
      }, 3000)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const filesArray = Array.from(selectedFiles)
      filesArray.forEach(handleFileUpload)
      if (onFileUpload) {
        onFileUpload(filesArray)
      }
    }
  }

  const handleFolderClick = (targetFolderId: Id<"folders">) => {
    const basePath = pathname?.includes("/files") ? pathname : `${pathname}/files`
    router.push(`${basePath}?folder=${targetFolderId}`)
  }

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
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "📊"
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📽️"
    if (fileType.includes("zip") || fileType.includes("rar")) return "🗜️"
    return "📎"
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
      {/* Upload Button */}
      <div className="flex justify-between items-center">
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
      </div>

      {/* File and Folder List */}
      <div className="space-y-2">
        {/* Show uploading files first */}
        {uploadingFiles.map((file) => (
          <Card key={`uploading-${file.name}`} className="transition-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                  file.status === "complete" && "bg-green-500/10",
                  file.status === "uploading" && "bg-primary/10",
                  file.status === "error" && "bg-destructive/10"
                )}>
                  {file.status === "complete" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : file.status === "error" ? (
                    <FileIcon className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium truncate">{file.name}</h4>
                  <div className="mt-1 space-y-1">
                    <Progress value={file.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {file.status === "complete"
                        ? "Upload complete"
                        : file.status === "error"
                        ? "Upload failed"
                        : `Uploading... ${Math.round(file.progress)}%`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Show folders */}
        {folders && folders.length > 0 && folders.map((folder) => (
          <Card
            key={folder._id}
            className="transition-shadow hover:shadow-md cursor-pointer"
            onClick={() => handleFolderClick(folder._id)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium truncate">{folder.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Folder
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Show files */}
        {files && files.length === 0 && folders && folders.length === 0 && uploadingFiles.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">No files uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          files?.map((file) => (
            <Card key={file._id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                    {getFileIcon(file.fileType || "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium truncate">{file.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize || 0)} • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => file.storageId && handleDownload(file.storageId)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRenameFile(file)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteFile(file)}
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
    </div>
  )
}

// Export the FileList component and handleFileUpload for parent use
export { FileList as default }

