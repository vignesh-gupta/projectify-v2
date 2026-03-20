"use client"

import { Button } from "@workspace/ui/components/button"
import { Plus } from "lucide-react"
import { motion } from "motion/react"

interface DashboardHeaderProps {
  activeProjectsCount: number
  teamsCount: number
  onCreateProject?: () => void
}

export function DashboardHeader({
  activeProjectsCount,
  teamsCount,
  onCreateProject,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="flex items-center justify-between px-8 py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            Account Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. You have{" "}
            <span className="font-medium text-primary">
              {activeProjectsCount} active{" "}
              {activeProjectsCount === 1 ? "project" : "projects"}
            </span>{" "}
            across {teamsCount} {teamsCount === 1 ? "team" : "teams"}.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button className="gap-2" onClick={onCreateProject}>
            <Plus className="size-4" />
            CREATE NEW PROJECT
          </Button>
        </motion.div>
      </div>
    </header>
  )
}
