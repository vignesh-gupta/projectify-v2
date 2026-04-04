"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  FEEDBACK_CATEGORY_OPTIONS,
  type FeedbackCategory,
} from "./feedback-helpers"

interface PublicFeedbackSubmitDialogProps {
  projectId: Id<"projects">
  anonymousId: string
}

export function PublicFeedbackSubmitDialog({
  projectId,
  anonymousId,
}: PublicFeedbackSubmitDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<FeedbackCategory>("feature")
  const [submitterName, setSubmitterName] = useState("")
  const [submitterEmail, setSubmitterEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createPublicFeedback = useMutation(api.feedback.createPublic)

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setCategory("feature")
    setSubmitterName("")
    setSubmitterEmail("")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      toast.error("Please enter a feedback title")
      return
    }
    if (!description.trim()) {
      toast.error("Please add details for this feedback")
      return
    }

    setIsSubmitting(true)
    try {
      await createPublicFeedback({
        projectId,
        title: title.trim(),
        description: description.trim(),
        category,
        submitterName: submitterName.trim() || undefined,
        submitterEmail: submitterEmail.trim() || undefined,
        anonymousId,
      })

      toast.success("Feedback submitted successfully")
      resetForm()
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : "Failed to submit feedback"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          resetForm()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Submit feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-180">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit public feedback</DialogTitle>
            <DialogDescription>
              Share a bug, idea, or improvement request with the team.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="public-feedback-name">Name</Label>
                <Input
                  id="public-feedback-name"
                  value={submitterName}
                  onChange={(event) => setSubmitterName(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-feedback-email">Email</Label>
                <Input
                  id="public-feedback-email"
                  type="email"
                  value={submitterEmail}
                  onChange={(event) => setSubmitterEmail(event.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="public-feedback-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="public-feedback-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What should change?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explain the problem, impact, and what you’d like to happen."
                className="min-h-40 resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="public-feedback-category">Category</Label>
              <Select
                value={category}
                onValueChange={(value: FeedbackCategory) => setCategory(value)}
              >
                <SelectTrigger id="public-feedback-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
