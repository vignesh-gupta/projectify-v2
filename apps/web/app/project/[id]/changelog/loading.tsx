export default function ProjectChangelogLoading() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="space-y-3">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-96 rounded bg-muted" />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-11/12 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
