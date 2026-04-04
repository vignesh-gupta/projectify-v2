"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { ArrowUpRight, MessageSquare, RefreshCw, Sparkles, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  FEEDBACK_STATUS_OPTIONS,
  formatFeedbackDate,
  getCategoryLabel,
  getStatusLabel,
  type FeedbackStatus,
} from "./feedback-helpers"
import { useRouter } from "next/navigation"

type FeedbackItem = Doc<"feedback"> & {
  hasVoted: boolean
  author: {
    _id: Id<"users">
    name: string | null
    email: string
    image?: string | null
  } | null
}

interface FeedbackCardProps {
  feedback: FeedbackItem
  isPrivileged: boolean
  publicMode?: boolean
  anonymousId?: string
}

export function FeedbackCard({
  feedback,
  isPrivileged,
  publicMode = false,
  anonymousId,
}: FeedbackCardProps) {
  const router = useRouter()
  const [detailOpen, setDetailOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [isVoteSubmitting, setIsVoteSubmitting] = useState(false)
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false)
  const [isVisibilitySubmitting, setIsVisibilitySubmitting] = useState(false)
  const [isConvertSubmitting, setIsConvertSubmitting] = useState(false)

  const toggleVote = useMutation(api.feedback.toggleVote)
  const updateFeedback = useMutation(api.feedback.update)
  const convertToTask = useMutation(api.feedback.convertToTask)
  const addComment = useMutation(api.feedback.addComment)

  const comments = useQuery(
    api.feedback.listComments,
    detailOpen && !publicMode ? { feedbackId: feedback._id } : "skip"
  )

  const submitterLabel =
    feedback.author?.name ??
    feedback.submitterName ??
    feedback.author?.email ??
    feedback.submitterEmail ??
    "Anonymous"

  const handleVote = async () => {
    setIsVoteSubmitting(true)

    try {
      await toggleVote({
        feedbackId: feedback._id,
        anonymousId: publicMode ? anonymousId : undefined,
      })
    } catch (error) {
      console.error(error)
      toast.error(
        publicMode ? "Unable to register vote" : "Unable to update vote"
      )
    } finally {
      setIsVoteSubmitting(false)
    }
  }

  const handleStatusChange = async (status: FeedbackStatus) => {
    setIsStatusSubmitting(true)

    try {
      await updateFeedback({
        feedbackId: feedback._id,
        status,
      })
      toast.success("Feedback status updated")
    } catch (error) {
      console.error(error)
      toast.error("Unable to update feedback status")
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  const handleVisibilityToggle = async () => {
    setIsVisibilitySubmitting(true)

    try {
      await updateFeedback({
        feedbackId: feedback._id,
        isPublic: !feedback.isPublic,
      })
      toast.success(
        feedback.isPublic
          ? "Removed from public board"
          : "Added to public board"
      )
    } catch (error) {
      console.error(error)
      toast.error("Unable to update visibility")
    } finally {
      setIsVisibilitySubmitting(false)
    }
  }

  const handleConvertToTask = async () => {
    setIsConvertSubmitting(true)

    try {
      const result = await convertToTask({ feedbackId: feedback._id })
      toast.success(
        result.alreadyLinked ? "Opened existing linked task" : "Feedback converted to task"
      )
    } catch (error) {
      console.error(error)
      toast.error("Unable to convert feedback to task")
    } finally {
      setIsConvertSubmitting(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Please write a comment first")
      return
    }

    setIsCommentSubmitting(true)

    try {
      await addComment({
        feedbackId: feedback._id,
        content: comment.trim(),
      })
      setComment("")
      toast.success("Comment added")
    } catch (error) {
      console.error(error)
      toast.error("Unable to add comment")
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  const openLinkedTask = () => {
    if (!feedback.linkedTaskId) return
    router.push(`/project/${feedback.projectId}/work-items?taskId=${feedback.linkedTaskId}`)
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {getCategoryLabel(feedback.category)}
                </Badge>
                <Badge
                  variant={feedback.status === "done" ? "default" : "outline"}
                >
                  {getStatusLabel(feedback.status)}
                </Badge>
                {feedback.isPublic && !publicMode ? (
                  <Badge variant="outline">Public</Badge>
                ) : null}
              </div>

              <button
                type="button"
                className="text-left text-lg leading-tight font-semibold hover:text-primary"
                onClick={() => setDetailOpen(true)}
              >
                {feedback.title}
              </button>
            </div>

            <Button
              type="button"
              variant={feedback.hasVoted ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={handleVote}
              disabled={isVoteSubmitting}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              {feedback.votes}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Submitted by {submitterLabel} on {formatFeedbackDate(feedback.createdAt)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div
            className="prose prose-sm line-clamp-4 max-w-none text-sm text-muted-foreground **:my-0"
            dangerouslySetInnerHTML={{ __html: feedback.description }}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDetailOpen(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Details
            </Button>

            {feedback.linkedTaskId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openLinkedTask}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Open Task
              </Button>
            ) : null}

            {isPrivileged && !publicMode ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleConvertToTask}
                disabled={isConvertSubmitting}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {feedback.linkedTaskId ? "Reuse Linked Task" : "Convert to Task"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-2xl!">
          <SheetHeader className="pr-12">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {getCategoryLabel(feedback.category)}
              </Badge>
              <Badge
                variant={feedback.status === "done" ? "default" : "outline"}
              >
                {getStatusLabel(feedback.status)}
              </Badge>
              {feedback.isPublic ? (
                <Badge variant="outline">Public</Badge>
              ) : null}
            </div>
            <SheetTitle className="text-xl">{feedback.title}</SheetTitle>
            <SheetDescription>
              Submitted by {submitterLabel} on {formatFeedbackDate(feedback.createdAt)}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-6 pb-6">
              <div
                className="prose prose-sm max-w-none **:text-foreground"
                dangerouslySetInnerHTML={{ __html: feedback.description }}
              />

              {!publicMode ? (
                <>
                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    {isPrivileged ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Workflow status
                        </div>
                        <Select
                          value={feedback.status}
                          onValueChange={(value: FeedbackStatus) =>
                            handleStatusChange(value)
                          }
                          disabled={isStatusSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FEEDBACK_STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                    {feedback.linkedTaskId ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Linked work item</div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={openLinkedTask}
                        >
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Open linked task
                        </Button>
                      </div>
                    ) : null}

                    {isPrivileged ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Public visibility
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleVisibilityToggle}
                          disabled={isVisibilitySubmitting}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {feedback.isPublic
                            ? "Remove from public board"
                            : "Publish on public board"}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">Comments</h3>
                        <p className="text-sm text-muted-foreground">
                          Capture extra context before turning feedback into
                          work.
                        </p>
                      </div>
                      <Badge variant="outline">
                        {comments?.length ?? 0} comment
                        {comments?.length === 1 ? "" : "s"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <Textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Add a note for the team..."
                        rows={4}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleCommentSubmit}
                          disabled={isCommentSubmitting}
                        >
                          {isCommentSubmitting ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {comments === undefined ? (
                        <div className="text-sm text-muted-foreground">
                          Loading comments...
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          No comments yet.
                        </div>
                      ) : (
                        comments.map((entry) => (
                          <div
                            key={entry._id}
                            className="rounded-lg border p-4"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div className="text-sm font-medium">
                                {entry.author?.name ??
                                  entry.author?.email ??
                                  "Unknown"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatFeedbackDate(entry.createdAt)}
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                              {entry.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
