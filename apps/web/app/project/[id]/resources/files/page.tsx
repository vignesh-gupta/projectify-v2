"use client"

import { Id } from "@/convex/_generated/dataModel"
import { useFolderId } from "@/hooks/nuqs/use-folder-id"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Search } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { DropZoneWrapper } from "../components/drop-zone-wrapper"
import { FileList, FileListHandle } from "../components/file-list"
import { FolderNav } from "../components/folder-nav"
import { ResourceSearch } from "../components/resource-search"

export default function FilesPage() {
  const { id: projectId } = useParams<{ id: Id<"projects"> }>()
  const { folderId } = useFolderId()

  const fileListRef = useRef<FileListHandle>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleFileDrop = (files: File[]) => {
    fileListRef.current?.uploadFiles(files)
  }

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <DropZoneWrapper
      projectId={projectId}
      folderId={folderId || undefined}
      onFileDrop={handleFileDrop}
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Files</h1>
              <p className="mt-2 text-muted-foreground">
                Browse and manage all project files
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Search
              <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                ⌘K
              </Badge>
            </Button>
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

      {/* Search Dialog */}
      <ResourceSearch
        projectId={projectId}
        type="file"
        folderId={folderId || undefined}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </DropZoneWrapper>
  )
}
