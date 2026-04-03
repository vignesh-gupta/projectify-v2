"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { Search, File, Link as LinkIcon, FolderOpen, X } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Badge } from "@workspace/ui/components/badge"

interface ResourceSearchProps {
  projectId: Id<"projects">
  type?: "file" | "link"
  folderId?: Id<"folders">
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResourceSearch({
  projectId,
  type,
  folderId,
  open,
  onOpenChange,
}: ResourceSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const router = useRouter()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const results = useQuery(
    api.resources.searchResources,
    debouncedQuery.length >= 2
      ? {
          projectId,
          query: debouncedQuery,
          type,
          folderId,
        }
      : "skip"
  )

  const handleSelect = (resource: any) => {
    // Navigate to the resource's folder
    const basePath = `/project/${projectId}/resources/${resource.type === "file" ? "files" : "links"}`
    
    if (resource.folderId) {
      router.push(`${basePath}?folderId=${resource.folderId}`)
    } else {
      router.push(basePath)
    }
    
    onOpenChange(false)
    setSearchQuery("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("")
    }
    onOpenChange(newOpen)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️"
    if (fileType.startsWith("video/")) return "🎥"
    if (fileType.startsWith("audio/")) return "🎵"
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("zip") || fileType.includes("rar")) return "🗜️"
    if (fileType.includes("word") || fileType.includes("document")) return "📝"
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊"
    if (fileType.includes("powerpoint") || fileType.includes("presentation")) return "📊"
    return "📎"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[43.75rem] p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>Search Resources</DialogTitle>
        </DialogHeader>
        
        <Command className="rounded-lg border-0" shouldFilter={false}>
          <CommandInput
            placeholder="Type to search files and links..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {searchQuery.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : results === undefined ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>No resources found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Results">
                {results.map((resource) => (
                  <CommandItem
                    key={resource._id}
                    value={resource._id}
                    onSelect={() => handleSelect(resource)}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-muted">
                      {resource.type === "file" ? (
                        <span className="text-lg">
                          {getFileIcon(resource.fileType || "")}
                        </span>
                      ) : (
                        <LinkIcon className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{resource.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {resource.type}
                        </Badge>
                      </div>
                      
                      {resource.folderPath && resource.folderPath.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FolderOpen className="h-3 w-3" />
                          <span>{resource.folderPath.join(" / ")}</span>
                        </div>
                      )}
                      
                      {resource.type === "file" && resource.fileSize && (
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(resource.fileSize)}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
