"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus, Search, TrendingUp, Users } from "lucide-react"
import { motion, Variants } from "motion/react"

const stats = [
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

const projects = [
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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
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

  const scaleVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <div className="min-h-full">
      {/* Header */}
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
                12 active projects
              </span>{" "}
              across 3 teams.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button className="gap-2">
              <Plus className="size-4" />
              CREATE NEW PROJECT
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="border-b border-border p-8">
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <motion.div
                className="h-full border border-border bg-card p-6 transition-all hover:border-primary/30"
                variants={cardHoverVariants}
                initial="initial"
                whileHover="hover"
              >
                <div className="flex items-start justify-between">
                  <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {stat.label}
                  </div>
                  <div className="flex size-8 items-center justify-center bg-primary/10 text-lg">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-3 text-4xl font-bold text-foreground">
                  {stat.value}
                </div>
                {stat.change && (
                  <motion.div
                    className="mt-2 flex items-center gap-1 text-xs text-success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <TrendingUp className="size-3" />
                    {stat.change}
                  </motion.div>
                )}
                {stat.detail && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {stat.detail}
                  </div>
                )}
                {stat.avatars && (
                  <div className="mt-3 flex items-center gap-1">
                    {stat.avatars.map((avatar, i) => (
                      <div
                        key={i}
                        className="flex size-6 items-center justify-center bg-muted text-[10px]"
                      >
                        {avatar}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Projects Section */}
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <motion.h2
            className="text-xl font-semibold tracking-wider text-muted-foreground uppercase"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Active Projects
          </motion.h2>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter projects"
                className="w-64 bg-input pl-9"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="size-4" />
              SORT BY
            </Button>
          </motion.div>
        </div>

        {/* Projects Grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={itemVariants}>
              <motion.div
                className="group relative flex h-full flex-col justify-between overflow-hidden border border-border bg-card p-6 transition-all hover:border-primary/30"
                variants={cardHoverVariants}
                initial="initial"
                whileHover="hover"
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
          ))}

          {/* Add New Project Card */}
          <motion.button
            className="group flex min-h-70 flex-col items-center justify-center border-2 border-dashed border-border bg-card/50 transition-all hover:border-primary/50 hover:bg-card"
            variants={itemVariants}
            whileHover="hover"
            initial="initial"
          >
            <motion.div
              className="flex size-16 items-center justify-center bg-muted transition-transform"
              variants={scaleVariants}
              initial="initial"
              whileHover="hover"
            >
              <Plus className="size-8 text-muted-foreground" />
            </motion.div>
            <span className="mt-4 text-sm font-medium tracking-wider text-muted-foreground uppercase">
              New Project
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
