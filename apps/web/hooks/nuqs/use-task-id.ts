import { Id } from "@/convex/_generated/dataModel"
import { useQueryState } from "nuqs"

export const TASK_ID_QUERY_KEY = "task_id"

export const useTaskId = () =>
  useQueryState<Id<"tasks">>(TASK_ID_QUERY_KEY, {
    history: "push",
    clearOnDefault: true,
    parse: (value) => value as Id<"tasks">,
    type: "single",
  })
