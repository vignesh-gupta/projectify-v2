import type { Id } from "@/convex/_generated/dataModel"
import { getPublishedChangelog } from "@/lib/changelog-api"
import { formatChangelogDate } from "@/lib/changelog-presenter"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Rss, Sparkles } from "lucide-react"
import Link from "next/link"

interface PublicChangelogPageProps {
  params: Promise<{ projectId: string }>
}

export default async function PublicChangelogPage({
  params,
}: PublicChangelogPageProps) {
  const { projectId } = await params

  const data = await getPublishedChangelog(projectId as Id<"projects">)
  type PublishedEntry = (typeof data.entries)[number]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5" />
            Product updates
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">
                {data.project.title} changelog
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Follow published releases, improvements, fixes, and breaking
                changes for this project.
              </p>
            </div>
            <Link
              href={`/changelog/${projectId}/rss.xml`}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
            >
              <Rss className="size-4" />
              RSS feed
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          {data.entries.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No published changelog entries yet.
              </CardContent>
            </Card>
          ) : (
            data.entries.map((entry: PublishedEntry) => {
              return (
                <Card key={entry._id}>
                  <CardHeader className="gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="gap-1 rounded-full px-2.5 py-1 font-medium"
                      >
                        <span className="text-muted-foreground">v</span>
                        <span>{entry.version}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatChangelogDate(entry.publishedAt)}
                      </span>
                    </div>
                    <CardTitle className="text-2xl">{entry.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <article
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: entry.content }}
                    />
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
