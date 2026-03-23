"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { FileList, FileListHandle } from "../components/file-list"
import { DropZoneWrapper } from "../components/drop-zone-wrapper"
import { FolderNav } from "../components/folder-nav"
import { Id } from "@/convex/_generated/dataModel"

export default function FilesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as Id<"projects">
  const folderId = searchParams.get("folder") as Id<"folders"> | null
  const fileListRef = useRef<FileListHandle>(null)

  const handleFileDrop = (files: File[]) => {
    fileListRef.current?.uploadFiles(files)
  }

  return (
    <DropZoneWrapper
      projectId={projectId}
      folderId={folderId || undefined}
      onFileDrop={handleFileDrop}
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Files</h1>
            <p className="mt-2 text-muted-foreground">
              Browse and manage all project files
            </p>
          </div>

          {/* Folder Navigation */}
          <FolderNav
            projectId={projectId}
            folderId={folderId || undefined}
            type="file"
          />

          {/* File List */}
          <FileList
            ref={fileListRef}
            projectId={projectId}
            folderId={folderId || undefined}
          />
        </div>
      </div>
    </DropZoneWrapper>
  )
}
