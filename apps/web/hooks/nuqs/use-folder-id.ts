import { Id } from "@/convex/_generated/dataModel"
import { useQueryState } from "nuqs"

export const FOLDER_ID_QUERY_KEY = "folder_id"

export const useFolderId = () => {
  const [folderId, setFolderId] = useQueryState<Id<"folders"> | null>(
    FOLDER_ID_QUERY_KEY,
    {
      history: "push",
      clearOnDefault: true,
      parse: (value) => {
        if (typeof value === "string" && value.length === 32) {
          return value as Id<"folders">
        }
        return null
      },
      type: "single",
      defaultValue: null,
    }
  )
  return { folderId, setFolderId }
}
