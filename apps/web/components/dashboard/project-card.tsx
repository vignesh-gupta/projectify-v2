"use client"

import { motion, Variants } from "motion/react"

export interface Project {
  id: number | string
  icon: string
  iconBg: string
  title: string
  description: string
  status: string
  statusColor: string
  progress: number
  progressColor: string
  updated: string
  members: string[]
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

export function ProjectCard({ project, onClick }: ProjectCardProps) {
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
              className={`flex size-12 items-center justify-center ${project.iconBg} text-2xl text-card`}
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.3 }}
            >
              {project.icon}
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
            <div className="flex items-center gap-1">
              {project.members.map((member, i) => (
                <motion.div
                  key={i}
                  className="flex size-7 items-center justify-center bg-muted text-xs"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                >
                  {member}
                </motion.div>
              ))}
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
