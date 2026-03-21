"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  CheckSquare,
  FileText,
  FolderOpen,
  MessageSquare,
  Settings,
  Star,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserProfileDropdown } from "./user-profile-dropdown"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface ProjectSidebarProps {
  projectId: string
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname()
  const project = useQuery(api.projects.getProject, { 
    projectId: projectId as Id<"projects"> 
  })

  const projectTitle = project?.title ?? "Project"

  const navItems = [
    {
      href: `/project/${projectId}`,
      label: "Dashboard",
      icon: FolderOpen,
    },
    {
      href: `/project/${projectId}/work-items`,
      label: "Work Items",
      icon: CheckSquare,
    },
    {
      href: `/project/${projectId}/resources`,
      label: "Resources",
      icon: FileText,
    },
    {
      href: `/project/${projectId}/feedbacks`,
      label: "Feedbacks",
      icon: Star,
    },
    {
      href: `/project/${projectId}/changelog`,
      label: "Changelog",
      icon: FileText,
    },
    {
      href: `/project/${projectId}/messages`,
      label: "Messages",
      icon: MessageSquare,
    },
    {
      href: `/project/${projectId}/settings`,
      label: "Settings",
      icon: Settings,
    },
  ]

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* Project Header */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center rounded bg-primary">
            <FolderOpen className="size-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">
              {projectTitle}
            </span>
            <span className="text-xs text-muted-foreground">Project</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile */}
      <SidebarFooter>
        <UserProfileDropdown />
      </SidebarFooter>
    </Sidebar>
  )
}
