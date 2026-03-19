"use client"

import { Button } from "@workspace/ui/components/button"
import { LogoCloud } from "@/components/logo-cloud"
import { cn } from "@workspace/ui/lib/utils"
import { motion } from "motion/react"
import { ArrowRightIcon, Sparkles, Zap } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      {/* Top Shades */}
      <div
        aria-hidden="true"
        className="absolute inset-0 isolate hidden overflow-hidden contain-strict lg:block"
      >
        <div className="absolute inset-0 -top-14 isolate -z-10 bg-[radial-gradient(35%_80%_at_49%_0%,oklch(0.65_0.19_35/0.12),transparent)] contain-strict" />
      </div>

      {/* X Bold Faded Borders */}
      <div
        aria-hidden="true"
        className="absolute inset-0 mx-auto hidden min-h-screen w-full max-w-5xl lg:block"
      >
        <div className="absolute inset-y-0 left-0 z-10 h-full w-px bg-foreground/15 mask-y-from-80% mask-y-to-100%" />
        <div className="absolute inset-y-0 right-0 z-10 h-full w-px bg-foreground/15 mask-y-from-80% mask-y-to-100%" />
      </div>

      {/* main content */}
      <div className="relative flex flex-col items-center justify-center gap-5 pt-32 pb-30">
        {/* X Content Faded Borders */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-1 size-full overflow-hidden"
        >
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
          <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
          <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
        </div>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={cn(
            "group mx-auto flex w-fit items-center gap-3 border bg-card px-3 py-1 shadow transition-all hover:shadow-md"
          )}
          href="#link"
        >
          <Sparkles className="size-3 text-primary" />
          <span className="text-xs">shipped new features!</span>
          <span className="block h-5 border-l" />
          <ArrowRightIcon className="size-3 duration-150 ease-out group-hover:translate-x-1" />
        </motion.a>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            "text-center text-4xl font-bold tracking-tight text-balance md:text-5xl lg:text-6xl"
          )}
        >
          Ship Projects with <br />{" "}
          <span className="text-primary">Clarity & Velocity</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto max-w-md text-center text-base tracking-wider text-foreground/80 md:text-lg"
        >
          Connecting teams with clarity. <br /> Track, collaborate, and
          deliver—all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-row flex-wrap items-center justify-center gap-3 pt-2"
        >
          <Button size="lg" variant="secondary" className="group">
            <Zap className="mr-2 size-4 transition-transform group-hover:scale-110" />
            Book a Call
          </Button>
          <Link href="/dashboard">
            <Button size="lg" className="group">
              Get started
              <ArrowRightIcon className="ms-2 size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export function LogosSection() {
  return (
    <section className="relative space-y-4 border-t pt-6 pb-10">
      <h2 className="text-center text-lg font-medium tracking-tight text-muted-foreground md:text-xl">
        Trusted by <span className="text-foreground">experts</span>
      </h2>
      <div className="relative z-10 mx-auto max-w-4xl">
        <LogoCloud logos={logos} />
      </div>
    </section>
  )
}

const logos = [
  {
    src: "https://storage.efferd.com/logo/nvidia-wordmark.svg",
    alt: "Nvidia Logo",
  },
  {
    src: "https://storage.efferd.com/logo/supabase-wordmark.svg",
    alt: "Supabase Logo",
  },
  {
    src: "https://storage.efferd.com/logo/openai-wordmark.svg",
    alt: "OpenAI Logo",
  },
  {
    src: "https://storage.efferd.com/logo/turso-wordmark.svg",
    alt: "Turso Logo",
  },
  {
    src: "https://storage.efferd.com/logo/vercel-wordmark.svg",
    alt: "Vercel Logo",
  },
  {
    src: "https://storage.efferd.com/logo/github-wordmark.svg",
    alt: "GitHub Logo",
  },
  {
    src: "https://storage.efferd.com/logo/claude-wordmark.svg",
    alt: "Claude AI Logo",
  },
  {
    src: "https://storage.efferd.com/logo/clerk-wordmark.svg",
    alt: "Clerk Logo",
  },
]
