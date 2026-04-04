"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { Filter, MessageSquareMore, TrendingUp } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Badge } from "@workspace/ui/components/badge"
import { FeedbackCard } from "./feedback-card"
import {
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
  type FeedbackCategory,
  type FeedbackStatus,
} from "./feedback-helpers"

interface FeedbackBoardProps {
  projectId: Id<"projects">
  isPrivileged: boolean
  publicMode?: boolean
  anonymousId?: string
}

export function FeedbackBoard({
  projectId,
  isPrivileged,
  publicMode = false,
  anonymousId,
}: FeedbackBoardProps) {
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">(
    "all"
  )
  const [categoryFilter, setCategoryFilter] = useState<
    FeedbackCategory | "all"
  >("all")
  const [sortBy, setSortBy] = useState<"top" | "recent">("top")

  const feedbackItems = useQuery(
    publicMode ? api.feedback.listPublicByProject : api.feedback.listByProject,
    publicMode
      ? {
          projectId,
          anonymousId,
        }
      : {
          projectId,
        }
  )

  const filteredItems = useMemo(() => {
    if (!feedbackItems) {
      return []
    }

    return [...feedbackItems]
      .filter((item) =>
        statusFilter === "all" ? true : item.status === statusFilter
      )
      .filter((item) =>
        categoryFilter === "all" ? true : item.category === categoryFilter
      )
      .sort((left, right) => {
        if (sortBy === "top") {
          if (right.votes !== left.votes) {
            return right.votes - left.votes
          }
        }

        return right.createdAt - left.createdAt
      })
  }, [categoryFilter, feedbackItems, sortBy, statusFilter])

  const isLoading = feedbackItems === undefined

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4" />
              Prioritize by demand
            </div>
            <p className="text-sm text-muted-foreground">
              Sort by votes or recent submissions to decide what deserves
              attention next.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Select
              value={statusFilter}
              onValueChange={(value: FeedbackStatus | "all") =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="min-w-45">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {FEEDBACK_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value: FeedbackCategory | "all") =>
                setCategoryFilter(value)
              }
            >
              <SelectTrigger className="min-w-45">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {FEEDBACK_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value: "top" | "recent") => setSortBy(value)}
            >
              <SelectTrigger className="min-w-45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top voted first</SelectItem>
                <SelectItem value="recent">Newest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {isLoading ? "..." : filteredItems.length} items
        </Badge>
        <Badge variant="outline">
          {isLoading
            ? "..."
            : filteredItems.reduce((total, item) => total + item.votes, 0)}{" "}
          votes
        </Badge>
        {!publicMode ? (
          <Badge variant="outline">
            {isLoading
              ? "..."
              : filteredItems.filter((item) => item.isPublic).length}{" "}
            public
          </Badge>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
            <MessageSquareMore className="size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              No feedback matches these filters
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Try broadening the filters or submit a new item to get the board
              moving.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((feedback) => (
            <FeedbackCard
              key={feedback._id}
              feedback={feedback}
              isPrivileged={isPrivileged}
              publicMode={publicMode}
              anonymousId={anonymousId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
