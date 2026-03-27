"use client"

import { motion, Variants } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import * as LucideIcons from "lucide-react"

export interface ProjectMember {
  id: string
  name: string
  email: string
  image?: string
}

export interface Project {
  id: number | string
  iconName?: string
  iconBg: string
  title: string
  description: string
  status: string
  statusColor: string
  progress: number
  progressColor: string
  updated: string
  members: ProjectMember[]
}

interface ProjectCardProps {
  project: Project
  onClick?: (project: Project) => void
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

const cardHoverVariants: Variants = {
  initial: { y: 0, boxShadow: "0px 1px 3px rgba(0,0,0,0.1)" },
  hover: {
    boxShadow: "0px 12px 24px rgba(0,0,0,0.15)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
  }
  return (name.slice(0, 2) || "?").toUpperCase()
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  // Get the Lucide icon component
  const IconComponent = project.iconName
    ? (LucideIcons[project.iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>) || LucideIcons.FolderOpen
    : LucideIcons.FolderOpen

  return (
    <motion.div variants={itemVariants}>
      <motion.div
        className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden border border-border bg-card p-6 transition-all hover:border-primary/30"
        variants={cardHoverVariants}
        initial="initial"
        whileHover="hover"
        onClick={() => onClick?.(project)}
      >
        <div>
          {/* Project Icon & Status */}
          <div className="mb-4 flex items-start justify-between">
            <motion.div
              className={`flex size-12 items-center justify-center ${project.iconBg} text-card`}
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.3 }}
            >
              <IconComponent className="size-6" />
            </motion.div>
            <motion.span
              className={`border px-2 py-1 text-[10px] font-bold tracking-wider ${project.statusColor}`}
              initial={{ opacity: 0.8 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {project.status}
            </motion.span>
          </div>

          {/* Project Info */}
          <motion.h3
            className="text-lg font-semibold text-foreground"
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
          >
            {project.title}
          </motion.h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
        </div>

        <div>
          {/* Progress */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium tracking-wider text-muted-foreground uppercase">
                Progress
              </span>
              <span className="font-bold text-foreground">
                {project.progress}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden bg-muted">
              <motion.div
                className={`h-full ${project.progressColor} transition-all`}
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              {project.members.slice(0, 5).map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Avatar size="sm" className="ring-2 ring-background">
                    {member.image && <AvatarImage src={member.image} alt={member.name} />}
                    <AvatarFallback className="text-[10px] font-semibold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
              {project.members.length > 5 && (
                <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
                  +{project.members.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Updated {project.updated}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
