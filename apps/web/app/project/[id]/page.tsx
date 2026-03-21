"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useQuery } from "convex/react"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react"
import { useParams } from "next/navigation"

export default function ProjectDashboardPage() {
  const { id } = useParams()
  const projectId = id as Id<"projects">

  const project = useQuery(api.projects.getProject, { projectId })
  const analytics = useQuery(api.projects.getProjectAnalytics, { projectId })

  if (!project || !analytics) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Tasks",
      value: analytics.tasks.total,
      icon: Circle,
      description: `${analytics.tasks.done} completed`,
    },
    {
      title: "In Progress",
      value: analytics.tasks.inProgress,
      icon: Clock,
      description: `${analytics.tasks.todo} to do`,
    },
    {
      title: "Completion Rate",
      value: `${analytics.completionRate}%`,
      icon: TrendingUp,
      description: "Overall progress",
    },
    {
      title: "Team Members",
      value: analytics.team.total,
      icon: Users,
      description: `${analytics.team.owners} owner(s)`,
    },
    {
      title: "High Priority",
      value: analytics.tasks.highPriority,
      icon: AlertTriangle,
      description: "Tasks requiring attention",
    },
    {
      title: "Overdue",
      value: analytics.overdueTasks,
      icon: AlertTriangle,
      description: "Past due date",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
        <p className="text-muted-foreground">{project.description}</p>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              project.status === "development"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                : project.status === "maintenance"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            Your role: <span className="font-medium">{project.role}</span>
          </span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Task Status Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className="size-4 text-gray-400" />
                <span className="text-sm">To Do</span>
              </div>
              <span className="font-medium">{analytics.tasks.todo}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-blue-500" />
                <span className="text-sm">In Progress</span>
              </div>
              <span className="font-medium">{analytics.tasks.inProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                <span className="text-sm">Done</span>
              </div>
              <span className="font-medium">{analytics.tasks.done}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-red-500" />
                <span className="text-sm">High Priority</span>
              </div>
              <span className="font-medium">
                {analytics.tasks.highPriority}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-yellow-500" />
                <span className="text-sm">Medium Priority</span>
              </div>
              <span className="font-medium">
                {analytics.tasks.mediumPriority}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-gray-400" />
                <span className="text-sm">Low Priority</span>
              </div>
              <span className="font-medium">{analytics.tasks.lowPriority}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
