"use client"

import { Plus } from "lucide-react"
import { motion, Variants } from "motion/react"

interface AddProjectButtonProps {
  onClick?: () => void
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

const scaleVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
    },
  },
}

export function AddProjectButton({ onClick }: AddProjectButtonProps) {
  return (
    <motion.button
      className="group flex min-h-70 flex-col items-center justify-center border-2 border-dashed border-border bg-card/50 transition-all hover:border-primary/50 hover:bg-card"
      variants={itemVariants}
      whileHover="hover"
      initial="initial"
      onClick={onClick}
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
  )
}
