"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
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
import { useQuery } from "convex/react"
import {
  CheckSquare,
  FileText,
  FolderOpen,
  MessageSquare,
  Settings,
  Star,
} from "lucide-react"
import * as Icons from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserProfileDropdown } from "./user-profile-dropdown"

interface ProjectSidebarProps {
  projectId: Id<"projects">
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname()
  const project = useQuery(api.projects.getProject, {
    projectId: projectId,
  })

  // Get project icon URL if storage ID exists
  const iconUrl = useQuery(api.projects.getIconUrl, {
    storageId: project?.iconStorageId,
  })

  const projectTitle = project?.title ?? "Project"

  // Render the project icon
  const renderProjectIcon = () => {
    // If we have a storage icon URL, render the image
    if (iconUrl) {
      return (
        <Image
          src={iconUrl}
          alt={projectTitle}
          width={16}
          height={16}
          className="size-4 rounded object-cover"
        />
      )
    }

    // If we have a Lucide icon name, render that icon
    if (project?.iconName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IconComponent = (Icons as any)[project.iconName]
      if (IconComponent) {
        return <IconComponent className="size-4 text-primary-foreground" />
      }
    }

    // Default to FolderOpen if no icon is set
    return <FolderOpen className="size-4 text-primary-foreground" />
  }

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
            {renderProjectIcon()}
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
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
