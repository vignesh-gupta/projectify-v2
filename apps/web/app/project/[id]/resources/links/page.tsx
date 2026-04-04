"use client"

import { Id } from "@/convex/_generated/dataModel"
import { useFolderId } from "@/hooks/nuqs/use-folder-id"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Search } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FolderNav } from "../components/folder-nav"
import { LinkList } from "../components/link-list"
import { ResourceSearch } from "../components/resource-search"

export default function LinksPage() {
  const { id: projectId } = useParams<{ id: Id<"projects"> }>()
  const [searchOpen, setSearchOpen] = useState(false)
  const { folderId } = useFolderId()

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
        <LinkList projectId={projectId} folderId={folderId || undefined} />
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
