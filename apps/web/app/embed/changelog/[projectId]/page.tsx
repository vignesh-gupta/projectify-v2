import type { Id } from "@/convex/_generated/dataModel"
import { getPublishedChangelog } from "@/lib/changelog-api"
import {
  formatChangelogDate,
  renderChangelogContent,
} from "@/lib/changelog-presenter"

interface EmbedChangelogPageProps {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{
    limit?: string
    theme?: string
  }>
}

function clampLimit(value?: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return 5
  }

  return Math.min(Math.max(Math.floor(parsed), 1), 10)
}

export default async function EmbedChangelogPage({
  params,
  searchParams,
}: EmbedChangelogPageProps) {
  const { projectId } = await params
  const { limit, theme } = await searchParams
  const data = await getPublishedChangelog(projectId as Id<"projects">)
  const itemLimit = clampLimit(limit)
  const isDark = theme === "dark"
  const entries = data.entries.slice(0, itemLimit)

  return (
    <div
      className={`min-h-screen p-4 ${
        isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-950"
      }`}
    >
      <div
        className={`mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl border p-5 shadow-sm ${
          isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className={`text-xs font-semibold tracking-[0.24em] uppercase ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Changelog
            </p>
            <h1 className="text-xl font-semibold">{data.project.title}</h1>
          </div>
          <a
            href={`/changelog/${projectId}`}
            target="_blank"
            rel="noreferrer"
            className={`text-sm font-medium underline underline-offset-4 ${
              isDark ? "text-slate-200" : "text-slate-700"
            }`}
          >
            Open full page
          </a>
        </div>

        {entries.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${
              isDark
                ? "border-slate-700 text-slate-400"
                : "border-slate-300 text-slate-500"
            }`}
          >
            No published changelog entries yet.
          </div>
        ) : (
          entries.map((entry) => (
            <article
              key={entry._id}
              className={`rounded-2xl border p-4 ${
                isDark
                  ? "border-slate-800 bg-slate-950/60"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isDark
                      ? "bg-slate-800 text-slate-100"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  v{entry.version}
                </span>
                <span
                  className={`text-xs ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {formatChangelogDate(entry.publishedAt)}
                </span>
              </div>
              <h2 className="text-lg font-semibold">{entry.title}</h2>
              <div
                className={`prose prose-sm mt-3 max-w-none ${
                  isDark ? "prose-invert" : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: renderChangelogContent(entry.content),
                }}
              />
            </article>
          ))
        )}
      </div>
    </div>
  )
}
