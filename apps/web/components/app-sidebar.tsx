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
import { FolderKanban, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserProfileDropdown } from "./user-profile-dropdown"

export function AppSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/dashboard",
      label: "PROJECTS",
      icon: FolderKanban,
    },
    {
      href: "/settings",
      label: "SETTINGS",
      icon: Settings,
    },
  ]

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* Logo */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center bg-primary">
            <FolderKanban className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            PROJECTIFY
          </span>
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
