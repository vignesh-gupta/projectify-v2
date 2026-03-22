"use client"

import { useParams, useSearchParams } from "next/navigation"
import { LinkList } from "../components/link-list"
import { FolderNav } from "../components/folder-nav"
import { Id } from "@/convex/_generated/dataModel"

export default function LinksPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as Id<"projects">
  const folderId = searchParams.get("folder") as Id<"folders"> | null

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Links</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and manage all project links
          </p>
        </div>

        {/* Folder Navigation */}
        <FolderNav
          projectId={projectId}
          folderId={folderId || undefined}
          type="link"
        />

        {/* Link List */}
        <LinkList
          projectId={projectId}
          folderId={folderId || undefined}
        />
      </div>
    </div>
  )
}
