export default function DashboardLoading() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Header Skeleton */}
      <div className="border-b border-border bg-background px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-9 w-64 animate-pulse bg-muted" />
            <div className="mt-2 h-5 w-96 animate-pulse bg-muted" />
          </div>
          <div className="h-8 w-48 animate-pulse bg-muted" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="border-b border-border p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="h-4 w-24 bg-muted" />
                <div className="size-8 bg-muted" />
              </div>
              <div className="mt-3 h-10 w-20 bg-muted" />
              <div className="mt-2 h-3 w-32 bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section Skeleton */}
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-7 w-40 animate-pulse bg-muted" />
          <div className="flex gap-3">
            <div className="h-9 w-64 animate-pulse bg-muted" />
            <div className="h-9 w-32 animate-pulse bg-muted" />
          </div>
        </div>

        {/* Projects Grid Skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="size-12 bg-muted" />
                <div className="h-6 w-16 bg-muted" />
              </div>
              <div className="mt-4 h-6 w-3/4 bg-muted" />
              <div className="mt-2 h-10 w-full bg-muted" />
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-3 w-20 bg-muted" />
                  <div className="h-3 w-10 bg-muted" />
                </div>
                <div className="h-1.5 w-full bg-muted" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1">
                  <div className="size-7 bg-muted" />
                  <div className="size-7 bg-muted" />
                </div>
                <div className="h-3 w-16 bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
