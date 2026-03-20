"use client"

import { TrendingUp } from "lucide-react"

export interface Stat {
  label: string
  value: string
  change?: string
  trend?: "up" | "down"
  detail?: string
  icon: string
  avatars?: string[]
}

interface StatsGridProps {
  stats: Stat[]
  isLoading?: boolean
  error?: Error | null
}

interface StatsGridSkeletonProps {
  count?: number
}

export function StatsGridSkeleton({ count = 4 }: StatsGridSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-full border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="h-3 w-24 animate-pulse bg-muted" />
            <div className="size-8 animate-pulse bg-primary/10" />
          </div>
          <div className="mt-3 h-10 w-20 animate-pulse bg-muted" />
          <div className="mt-2 h-3 w-32 animate-pulse bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function StatsGridError({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
      <p className="text-sm text-destructive">
        Failed to load stats: {error.message}
      </p>
    </div>
  )
}

export function StatsGrid({ stats, isLoading, error }: StatsGridProps) {
  if (isLoading) {
    return <StatsGridSkeleton count={stats.length || 4} />
  }

  if (error) {
    return <StatsGridError error={error} />
  }

  if (!stats || stats.length === 0) {
    return null
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <div className="h-full border border-border bg-card p-6 transition-all hover:border-primary/30">
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
              <div className="mt-2 flex items-center gap-1 text-xs text-success">
                <TrendingUp className="size-3" />
                {stat.change}
              </div>
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
          </div>
        </div>
      ))}
    </div>
  )
}
