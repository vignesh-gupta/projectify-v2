"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { AccountSettings } from "@/components/settings/account-settings"
import { ProjectsList } from "@/components/settings/projects-list"
import { DeleteAccount } from "@/components/settings/delete-account"

export default function SettingsPage() {
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
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <ProjectsList />
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <DeleteAccount />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

