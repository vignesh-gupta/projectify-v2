"use client"

import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useRef } from "react"
import { DropZoneWrapper } from "./components/drop-zone-wrapper"
import { FileList, FileListHandle } from "./components/file-list"
import { LinkList } from "./components/link-list"

export default function ResourcesPage() {
  const { id: projectId } = useParams<{ id: Id<"projects"> }>()
  const fileListRef = useRef<FileListHandle>(null)

  const handleFileDrop = (files: File[]) => {
    fileListRef.current?.uploadFiles(files)
  }

  return (
    <DropZoneWrapper
      projectId={projectId}
      onFileDrop={handleFileDrop}
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
            <p className="mt-2 text-muted-foreground">
              Manage files and links for your project
            </p>
          </div>

          {/* Grid Layout for Files and Links */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Files Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-2">
                  <h2 className="text-xl font-semibold">Recent Files</h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/project/${projectId}/resources/files`}>
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <FileList ref={fileListRef} projectId={projectId} limit={5} hideFolders={true} showPath={true} />
            </div>

            {/* Links Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-2">
                  <h2 className="text-xl font-semibold">Recent Links</h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/project/${projectId}/resources/links`}>
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <LinkList projectId={projectId} limit={5} hideFolders={true} />
            </div>
          </div>
        </div>
      </div>
    </DropZoneWrapper>
  )
}
