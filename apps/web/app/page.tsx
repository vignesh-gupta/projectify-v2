/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  CirclePlay,
  Gauge,
  Layers3,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type RevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
}

function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReducedMotion(media.matches)
    onChange()
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.16 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transform-gpu transition-all duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
    >
      {children}
    </div>
  )
}

const features = [
  {
    icon: Workflow,
    title: "Unified planning flow",
    text: "Roadmaps, milestones, and execution share one source of truth.",
  },
  {
    icon: Gauge,
    title: "Clear progress signals",
    text: "Spot risks early and keep stakeholders aligned without extra meetings.",
  },
  {
    icon: TrendingUp,
    title: "Better outcomes over time",
    text: "Consistent process creates faster releases and higher team confidence.",
  },
]

export default function Page() {
  return (
    <main className="bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,oklch(0.74_0.12_265_/_0.12),transparent_62%)]" />

      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-primary" />
            Projectify
          </div>
          <nav className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#features">
              Features
            </a>
            <a className="transition-colors hover:text-foreground" href="#workflow">
              Workflow
            </a>
            <a className="transition-colors hover:text-foreground" href="#cta">
              Start
            </a>
          </nav>
          <Button size="sm" className="h-8 px-3 text-xs">
            Get started
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-24 sm:pt-28">
        <Reveal className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
          <Layers3 className="size-3.5" />
          Built for modern product teams
        </Reveal>

        <Reveal delay={80} className="mt-6 max-w-4xl">
          <h1 className="text-balance text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
            Calm, elegant project execution from plan to launch.
          </h1>
        </Reveal>

        <Reveal delay={140} className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Projectify helps your team move with clarity using a single, focused
          workspace for planning, delivery, and stakeholder updates.
        </Reveal>

        <Reveal delay={220} className="mt-9 flex flex-wrap items-center gap-3">
          <Button className="group h-11 px-5">
            Start free
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button variant="outline" className="group h-11 px-5">
            <CirclePlay className="mr-2 size-4 transition-transform group-hover:scale-110" />
            View demo
          </Button>
        </Reveal>

        <Reveal delay={280} className="mt-12 grid gap-3 sm:grid-cols-3">
          {[
            ["Cycle time", "32% faster"],
            ["On-time delivery", "96%"],
            ["Team confidence", "4.9 / 5"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl bg-muted/40 px-4 py-4 transition-all duration-300 hover:bg-muted/60"
            >
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 text-xl font-semibold">{value}</div>
            </div>
          ))}
        </Reveal>
      </section>

      <section id="features" className="border-y bg-muted/25">
        <div className="mx-auto w-full max-w-6xl px-6 py-[4.5rem]">
          <Reveal className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              A simpler way to keep momentum
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Everything you need to prioritize, deliver, and communicate progress.
            </p>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 90}>
                <article className="group">
                  <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-background shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-6xl px-6 py-[4.5rem]">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <Reveal>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Workflow
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                One clear path from strategy to shipped work
              </h2>
            </div>
          </Reveal>

          <div className="space-y-6">
            {[
              {
                title: "Define goals and outcomes",
                text: "Turn initiatives into scoped, measurable deliverables.",
              },
              {
                title: "Coordinate work without friction",
                text: "Shared ownership and dependencies prevent bottlenecks.",
              },
              {
                title: "Report progress effortlessly",
                text: "Live updates and clear signals keep everyone in sync.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <article className="flex gap-4">
                  <div className="mt-1 inline-flex size-6 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="mx-auto w-full max-w-6xl px-6 pb-[5.5rem]">
        <Reveal className="rounded-3xl bg-gradient-to-br from-muted/70 via-card to-background p-8 text-center sm:p-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to make delivery feel effortless?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Keep the team aligned, reduce status overhead, and ship with confidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button className="group h-11 px-6">
              Get started
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" className="h-11 px-6">
              Talk to sales
            </Button>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
