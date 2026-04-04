"use client"

import { AccountSettings } from "@/components/settings/account-settings"
import { ApiKeysList } from "@/components/settings/api-keys-list"
import { DeleteAccount } from "@/components/settings/delete-account"
import { ProjectsList } from "@/components/settings/projects-list"
import { SettingTab, useSettingTab } from "@/hooks/nuqs/use-setting-tab"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export const tabs = [
  { value: "account", label: "Account", Component: AccountSettings },
  { value: "projects", label: "Projects", Component: ProjectsList },
  { value: "api-keys", label: "API Keys", Component: ApiKeysList },
  { value: "danger", label: "Danger Zone", Component: DeleteAccount },
] as const

export default function SettingsPage() {
  const [tab, setTab] = useSettingTab()

  return (
    <div className="min-h-full">
      <header className="border-b border-border bg-background">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </header>

      <div className="p-8">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as SettingTab)}
          className="w-full"
        >
          <TabsList className="mb-8">
            {tabs.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(({ value, Component }) => (
            <TabsContent key={value} value={value}>
              <Component />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
