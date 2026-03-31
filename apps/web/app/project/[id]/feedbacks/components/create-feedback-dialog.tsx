"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { RichTextEditor } from "@/components/rich-text-editor"
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

interface CreateFeedbackDialogProps {
  projectId: Id<"projects">
}

export function CreateFeedbackDialog({ projectId }: CreateFeedbackDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<FeedbackCategory>("feature")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createFeedback = useMutation(api.feedback.create)

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setCategory("feature")
    setVisibility("private")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      toast.error("Please enter a feedback title")
      return
    }

    if (!description.trim()) {
      toast.error("Please add some context for this feedback")
      return
    }

    setIsSubmitting(true)

    try {
      await createFeedback({
        projectId,
        title: title.trim(),
        description: description.trim(),
        category,
        isPublic: visibility === "public",
      })

      toast.success("Feedback submitted")
      resetForm()
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to create feedback")
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
          New Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit feedback</DialogTitle>
            <DialogDescription>
              Capture ideas, bugs, and improvements so the team can prioritize
              them.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="feedback-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What should we improve?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Details</Label>
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="Share the problem, expected outcome, and any useful context."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feedback-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value: FeedbackCategory) =>
                    setCategory(value)
                  }
                >
                  <SelectTrigger id="feedback-category">
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

              <div className="space-y-2">
                <Label htmlFor="feedback-visibility">Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(value: typeof visibility) =>
                    setVisibility(value)
                  }
                >
                  <SelectTrigger id="feedback-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Internal only</SelectItem>
                    <SelectItem value="public">
                      Visible on public board
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
