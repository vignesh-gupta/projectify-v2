"use client"

import { DashboardHeader } from "./dashboard/dashboard-header"
import { StatsGrid, Stat } from "./dashboard/stats-grid"
import { ProjectsList } from "./dashboard/projects-list"
import { Project } from "./dashboard/project-card"

// Mock data - will be replaced with real Convex queries
const stats: Stat[] = [
  {
    label: "TOTAL TASKS",
    value: "128",
    change: "+12% vs last month",
    trend: "up",
    icon: "📊",
  },
  {
    label: "ACTIVE PROJECTS",
    value: "12",
    detail: "8 On track / 4 At risk",
    icon: "📁",
  },
  {
    label: "HOURS LOGGED",
    value: "42.5",
    detail: "This week",
    icon: "⏱️",
  },
  {
    label: "TEAM MEMBERS",
    value: "24",
    avatars: ["👤", "👤", "👤", "+21"],
    icon: "👥",
  },
]

const projects: Project[] = [
  {
    id: 1,
    icon: "🎯",
    iconBg: "bg-primary",
    title: "Q4 Marketing Campaign",
    description:
      "Strategy and creative asset development for the upcoming product launch, including cross-channel promotion and influencer partnerships.",
    status: "ACTIVE",
    statusColor: "text-success border-success",
    progress: 65,
    progressColor: "bg-primary",
    updated: "2h ago",
    members: ["👤", "👤"],
  },
  {
    id: 2,
    icon: "🎨",
    iconBg: "bg-warning",
    title: "v2.4 API Integration",
    description:
      "Legacy system migration and multi-endpoint architecture redesign for improved scalability and performance under increased load.",
    status: "AT RISK",
    statusColor: "text-warning border-warning",
    progress: 22,
    progressColor: "bg-warning",
    updated: "1d ago",
    members: ["👤"],
  },
  {
    id: 3,
    icon: "🎭",
    iconBg: "bg-primary",
    title: "Brand Guidelines Update",
    description: "Refreshing visual identity, iconography set, and typography",
    status: "ACTIVE",
    statusColor: "text-success border-success",
    progress: 92,
    progressColor: "bg-primary",
    updated: "10m ago",
    members: ["👤", "👤", "👤"],
  },
]

export default function DashboardPage() {
  const handleCreateProject = () => {
    // TODO: Open create project modal/dialog
    console.log("Create new project")
  }

  const handleProjectClick = (project: Project) => {
    // TODO: Navigate to project detail page
    console.log("Project clicked:", project.id)
  }

  return (
    <div className="min-h-full">
      <DashboardHeader
        activeProjectsCount={12}
        teamsCount={3}
        onCreateProject={handleCreateProject}
      />

      <div className="border-b border-border p-8">
        <StatsGrid stats={stats} />
      </div>

      <div className="p-8">
        <ProjectsList
          projects={projects}
          onCreateProject={handleCreateProject}
          onProjectClick={handleProjectClick}
        />
      </div>
    </div>
  )
}
