"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { LinkList } from "../components/link-list"
import { FolderNav } from "../components/folder-nav"
import { ResourceSearch } from "../components/resource-search"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

export default function LinksPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as Id<"projects">
  const folderId = searchParams.get("folderId") as Id<"folders"> | null
  const [searchOpen, setSearchOpen] = useState(false)

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
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Links</h1>
            <p className="mt-2 text-muted-foreground">
              Browse and manage all project links
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
          type="link"
        />

        {/* Link List */}
        <LinkList
          projectId={projectId}
          folderId={folderId || undefined}
        />
      </div>

      {/* Search Dialog */}
      <ResourceSearch
        projectId={projectId}
        type="link"
        folderId={folderId || undefined}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  )
}
