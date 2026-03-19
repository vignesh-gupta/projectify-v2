"use client"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { useAuthActions } from "@convex-dev/auth/react"
import { LogOut, Monitor, Moon, Sun, ChevronDown, User } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuthActions()
  const { state } = useSidebar()

  const handleSignOut = async () => {
    await signOut()
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="relative">
          <SidebarMenuButton
            size="lg"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-none bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 text-left leading-none">
              <span className="font-semibold">Alex Sterling</span>
              <span className="text-xs text-muted-foreground">Pro Account</span>
            </div>
            <ChevronDown
              className={`ml-auto size-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </SidebarMenuButton>

          {isOpen && state === "expanded" && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-none border border-sidebar-border bg-sidebar shadow-lg">
                {/* Theme Selection */}
                <div className="border-b border-sidebar-border p-2">
                  <div className="mb-2 px-2 text-xs font-medium text-sidebar-foreground/70">
                    THEME
                  </div>
                  <div className="space-y-1">
                    {themeOptions.map((option) => {
                      const Icon = option.icon
                      const isActive = theme === option.value

                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTheme(option.value)
                            setIsOpen(false)
                          }}
                          className={`flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <Icon className="size-4" />
                          {option.label}
                          {isActive && (
                            <span className="ml-auto text-xs">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Logout */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsOpen(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
