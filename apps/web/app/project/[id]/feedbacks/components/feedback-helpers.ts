export const FEEDBACK_CATEGORY_OPTIONS = [
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "bug", label: "Bug" },
] as const

export const FEEDBACK_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "rejected", label: "Rejected" },
] as const

export type FeedbackCategory =
  (typeof FEEDBACK_CATEGORY_OPTIONS)[number]["value"]
export type FeedbackStatus = (typeof FEEDBACK_STATUS_OPTIONS)[number]["value"]

export function getCategoryLabel(category: FeedbackCategory) {
  return (
    FEEDBACK_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.label ?? category
  )
}

export function getStatusLabel(status: FeedbackStatus) {
  return (
    FEEDBACK_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  )
}

export function formatFeedbackDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp))
}
