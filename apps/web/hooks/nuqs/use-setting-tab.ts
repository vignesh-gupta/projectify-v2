import { tabs } from "@/app/(main-dashboard)/settings/page"
import { useQueryState } from "nuqs"

export type SettingTab = (typeof tabs)[number]["value"]

export const useSettingTab = () =>
  useQueryState<SettingTab>("tab", {
    history: "push",
    clearOnDefault: true,
    parse: (value) => {
      if (tabs.some((tab) => tab.value === value)) {
        return value as SettingTab
      }
      return "account"
    },
    type: "single",
    defaultValue: "account",
  })
