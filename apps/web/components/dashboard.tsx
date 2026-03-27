"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { DashboardHeader } from "./dashboard/dashboard-header"
import { StatsGrid, type Stat } from "./dashboard/stats-grid"
import { ProjectsList } from "./dashboard/projects-list"
import type { Project } from "./dashboard/project-card"
import { CreateProjectDialog } from "./dashboard/create-project-dialog"

function getProjectIconBg(status: string): string {
  switch (status) {
    case "maintenance":
      return "bg-warning"
    case "inactive":
      return "bg-muted"
    default:
      return "bg-primary"
  }
}

function getProjectStatus(status: string): {
  label: string
  color: string
} {
  switch (status) {
    case "maintenance":
      return { label: "MAINTENANCE", color: "text-warning border-warning" }
    case "inactive":
      return { label: "INACTIVE", color: "text-muted-foreground border-muted" }
    default:
      return { label: "ACTIVE", color: "text-success border-success" }
  }
}

function getProgressColor(status: string): string {
  switch (status) {
    case "maintenance":
      return "bg-warning"
    case "inactive":
      return "bg-muted"
    default:
      return "bg-primary"
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function DashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()

  const convexProjects = useQuery(api.projects.listWithDetails)
  const isLoading = convexProjects === undefined

  // Transform Convex projects to UI format
  const projects: Project[] = useMemo(() => {
    if (!convexProjects) return []

    return convexProjects.map((project) => {
      const statusInfo = getProjectStatus(project.status!)
      return {
        id: project._id! as string,
        iconName: project.iconName,
        iconBg: getProjectIconBg(project.status!),
        title: project.title!,
        description: project.description!,
        status: statusInfo.label,
        statusColor: statusInfo.color,
        progress: project.progress || 0,
        progressColor: getProgressColor(project.status!),
        updated: formatRelativeTime(project.updatedAt!),
        members: project.members || [],
      }
    })
  }, [convexProjects])

  // Calculate stats
  const stats: Stat[] = useMemo(() => {
    const projectCount = projects.length
    const activeProjects = projects.filter((p) => p.status === "ACTIVE").length
    
    // Calculate total tasks across all projects
    const totalTasks = convexProjects?.reduce(
      (sum, project) => sum + (project.totalTasks || 0),
      0
    ) || 0

    // Get unique team members count across all projects
    const uniqueMemberIds = new Set<string>()
    convexProjects?.forEach((project) => {
      project.members?.forEach((member) => {
        uniqueMemberIds.add(member.id)
      })
    })
    const teamMembersCount = uniqueMemberIds.size

    return [
      {
        label: "TOTAL TASKS",
        value: String(totalTasks),
        detail: totalTasks === 1 ? "task" : "tasks",
        icon: "📊",
      },
      {
        label: "ACTIVE PROJECTS",
        value: String(activeProjects),
        detail: `${projectCount} total`,
        icon: "📁",
      },
      {
        label: "HOURS LOGGED",
        value: "0",
        detail: "Coming soon",
        icon: "⏱️",
      },
      {
        label: "TEAM MEMBERS",
        value: String(teamMembersCount),
        detail: teamMembersCount === 1 ? "member" : "members",
        icon: "👥",
      },
    ]
  }, [projects, convexProjects])

  const handleCreateProject = () => {
    setIsCreateDialogOpen(true)
  }

  const handleProjectClick = (project: Project) => {
    router.push(`/project/${project.id}`)
  }

  return (
    <>
      <div className="min-h-full">
        <DashboardHeader
          activeProjectsCount={
            projects.filter((p) => p.status === "ACTIVE").length
          }
          teamsCount={1}
          onCreateProject={handleCreateProject}
        />

        <div className="border-b border-border p-8">
          <StatsGrid stats={stats} isLoading={isLoading} />
        </div>

        <div className="p-8">
          <ProjectsList
            projects={projects}
            isLoading={isLoading}
            onCreateProject={handleCreateProject}
            onProjectClick={handleProjectClick}
          />
        </div>
      </div>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  )
}
