"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Search, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"

interface MessageSearchProps {
  projectId: Id<"projects">
}

export function MessageSearch({ projectId }: MessageSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  // Debounce search query
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    const timer = setTimeout(() => {
      setDebouncedQuery(value)
    }, 300)
    return () => clearTimeout(timer)
  }

  const searchResults = useQuery(
    api.messages.search,
    debouncedQuery.trim().length > 0
      ? { projectId, query: debouncedQuery }
      : "skip"
  )

  const clearSearch = () => {
    setSearchQuery("")
    setDebouncedQuery("")
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-300 dark:bg-yellow-600">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Search messages
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1 mt-4">
          {!debouncedQuery ? (
            <div className="text-center text-muted-foreground py-8">
              Type to search messages...
            </div>
          ) : searchResults === undefined ? (
            <div className="text-center text-muted-foreground py-8">
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages found for &quot;{debouncedQuery}&quot;
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((message) => (
                <div
                  key={message._id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    // Optionally: scroll to message or open thread
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.author?.image} />
                      <AvatarFallback>
                        {message.author?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm">
                          {message.author?.name || "Unknown User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(message.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1 break-words">
                        {highlightText(message.content, debouncedQuery)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
