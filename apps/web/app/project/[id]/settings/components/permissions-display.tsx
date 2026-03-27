"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Crown, Shield, User, Check } from "lucide-react"

const rolePermissions = {
  owner: {
    icon: Crown,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    capabilities: [
      "Full control over all project settings",
      "Delete the project",
      "Manage all team members",
      "Change member roles (including promoting to owner)",
      "Create, edit, and delete all tasks",
      "Manage all project resources",
      "Upload and manage files",
      "View all project analytics",
    ],
  },
  admin: {
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    capabilities: [
      "Manage team members (add and remove)",
      "Create, edit, and delete tasks",
      "Assign tasks to team members",
      "Manage project resources and folders",
      "Upload and organize files",
      "Update project information",
      "View project analytics",
    ],
  },
  member: {
    icon: User,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-900",
    capabilities: [
      "View project information",
      "Create new tasks",
      "Edit own tasks",
      "Comment on tasks",
      "Upload files to project",
      "View team members",
      "Update task status",
    ],
  },
}

export function PermissionsDisplay() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Role Permissions</h3>
        <p className="text-sm text-muted-foreground">
          Overview of capabilities for each role in the project
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(rolePermissions).map(([role, data]) => {
          const Icon = data.icon
          return (
            <Card key={role} className="overflow-hidden">
              <CardHeader className={`${data.bgColor} pb-4`}>
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg bg-white/80 p-2 dark:bg-black/30 ${data.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="capitalize">{role}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {data.capabilities.map((capability, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                      <span className="text-muted-foreground">{capability}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50">
        <CardHeader>
          <CardTitle className="text-base">Role Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Owner</strong> has the highest level of control and can perform all
              actions including deleting the project.
            </p>
            <p>
              <strong>Admin</strong> can manage day-to-day operations and team members but
              cannot delete the project.
            </p>
            <p>
              <strong>Member</strong> has viewing and contributing access but limited
              management capabilities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
