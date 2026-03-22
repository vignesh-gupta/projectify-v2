"use client"

import { useQuery } from "convex/react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { ExternalLink, Globe, MoreHorizontal, Trash2, Edit2, Folder } from "lucide-react"
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

type Resource = Doc<"resources">

interface LinkListProps {
  projectId: Id<"projects">
  folderId?: Id<"folders">
  limit?: number
}

export function LinkList({ projectId, folderId, limit }: LinkListProps) {
  const [editLink, setEditLink] = useState<Resource | null>(null)
  const [deleteLink, setDeleteLink] = useState<Resource | null>(null)
  const router = useRouter()
  const pathname = usePathname()

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

  const handleFolderClick = (targetFolderId: Id<"folders">) => {
    const basePath = pathname?.includes("/links") ? pathname : `${pathname}/links`
    router.push(`${basePath}?folder=${targetFolderId}`)
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
      {/* Add Link Button */}
      <div className="flex justify-between items-center">
        <CreateLinkDialog projectId={projectId} folderId={folderId} />
      </div>

      {/* Link and Folder List */}
      <div className="space-y-2">
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

        {links && links.length === 0 && folders && folders.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">No links saved yet</p>
            </CardContent>
          </Card>
        ) : (
          links?.map((link) => (
            <Card key={link._id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div
                  className="flex flex-1 cursor-pointer items-center gap-3 min-w-0"
                  onClick={() => handleOpenLink(link.url || "")}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    {link.favicon ? (
                      <Image
                        src={link.favicon}
                        alt={link.name}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null}
                    <Globe className={cn("h-5 w-5 text-muted-foreground", link.favicon && "hidden")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{link.name}</h4>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{link.url || ""}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenLink(link.url || "")}>
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
