"use client"

import { use } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { GeneralSettings } from "./components/general-settings"
import { MemberManagement } from "./components/member-management"
import { PermissionsDisplay } from "./components/permissions-display"
import { DangerZone } from "./components/danger-zone"
import { Settings, Users, Shield, AlertTriangle, Loader2 } from "lucide-react"
import { Card } from "@workspace/ui/components/card"

interface ProjectSettingsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { id: projectId } = use(params)
  const project = useQuery(api.projects.getProject, { projectId: projectId as Id<"projects"> })

  if (project === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Project Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
      </div>
    )
  }

  const isReadOnly = project.role === "member"

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-6 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
        <p className="text-base text-muted-foreground">
          Manage your project configuration, team members, and preferences.
        </p>
        {isReadOnly && (
          <Card className="border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              You have read-only access to these settings. Contact a project owner or admin to make changes.
            </p>
          </Card>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="size-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="size-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2">
            <AlertTriangle className="size-4" />
            <span className="hidden sm:inline">Danger Zone</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings project={project} isReadOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <MemberManagement
            projectId={projectId as Id<"projects">}
            currentUserRole={project.role}
            isReadOnly={isReadOnly}
          />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <PermissionsDisplay />
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <DangerZone
            projectId={projectId as Id<"projects">}
            projectTitle={project.title}
            currentUserRole={project.role}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
